package com.blue_erp.mobile.ui.screens.oficina.list_documents

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blue_erp.mobile.data.model.oficina.*
import com.blue_erp.mobile.data.repository.AuthRepository
import com.blue_erp.mobile.data.repository.oficina.DocumentRepository
import com.blue_erp.mobile.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject
import kotlinx.coroutines.delay

data class DocumentListUiState(
    val documents: List<DocumentResponse> = emptyList(),
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null,
    val page: Int = 1,
    val totalPages: Int = 0,
    val total: Int = 0,
    val status: DocumentStatus? = null,
    val type: DocumentType? = null,
    val startDate: LocalDate? = LocalDate.now(),
    val endDate: LocalDate? = LocalDate.now(),
    val isLoggedOut: Boolean = false,
    val clientTerm: String = "",
    val clientResults: List<ClientResponse> = emptyList(),
    val client: ClientResponse? = null,
    val assetTerm: String = "",
    val assetResults: List<AssetResponse> = emptyList(),
    val asset: AssetResponse? = null,
)

private enum class FetchMode { INITIAL, REFRESH, SILENT, MORE }

@HiltViewModel
class DocumentListViewModel @Inject constructor(
    private val documentRepository: DocumentRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private companion object {
        const val PAGE_SIZE = 20
        const val SEARCH_DELAY_MS = 350L
        const val MAX_SUGGESTIONS = 5
    }

    private val _uiState = MutableStateFlow(DocumentListUiState())
    val uiState: StateFlow<DocumentListUiState> = _uiState.asStateFlow()

    private var fetchJob: Job? = null
    private var clientSearchJob: Job? = null
    private var assetSearchJob: Job? = null

    init {
        fetch(page = 1, mode = FetchMode.INITIAL)
    }

    private fun buildFilters(state: DocumentListUiState) = DocumentFilters(
        type = state.type,
        status = state.status,
        clientId = state.client?.id,
        assetId = state.asset?.id,
        startDate = state.startDate?.toString(),
        endDate = state.endDate?.toString()
    )

    // ── Filtro por cliente ──
    fun onClientTermChange(term: String) {
        val hadSelection = _uiState.value.client != null
        clientSearchJob?.cancel()

        if (hadSelection) {
            applyFilters { it.copy(clientTerm = term, client = null, clientResults = emptyList()) }
        } else {
            _uiState.update { it.copy(clientTerm = term, clientResults = emptyList()) }
        }

        val query = term.trim()
        if (query.isEmpty()) return

        clientSearchJob = viewModelScope.launch {
            delay(SEARCH_DELAY_MS)
            val result = documentRepository.searchClients(query)
            _uiState.update {
                it.copy(
                    clientResults = if (result is Resource.Success) result.data.take(MAX_SUGGESTIONS)
                    else emptyList()
                )
            }
        }
    }

    fun selectClient(client: ClientResponse) {
        clientSearchJob?.cancel()
        applyFilters {
            it.copy(client = client, clientTerm = client.name, clientResults = emptyList())
        }
    }

    fun clearClient() {
        clientSearchJob?.cancel()
        applyFilters { it.copy(client = null, clientTerm = "", clientResults = emptyList()) }
    }

    // ── Filtro por veículo ──
    fun onAssetTermChange(term: String) {
        val hadSelection = _uiState.value.asset != null
        assetSearchJob?.cancel()

        if (hadSelection) {
            applyFilters { it.copy(assetTerm = term, asset = null, assetResults = emptyList()) }
        } else {
            _uiState.update { it.copy(assetTerm = term, assetResults = emptyList()) }
        }

        val query = term.trim()
        if (query.isEmpty()) return

        assetSearchJob = viewModelScope.launch {
            delay(SEARCH_DELAY_MS)
            val result = documentRepository.getAssets(search = query)
            _uiState.update {
                it.copy(
                    assetResults = if (result is Resource.Success) result.data.data.take(MAX_SUGGESTIONS)
                    else emptyList()
                )
            }
        }
    }

    fun selectAsset(asset: AssetResponse) {
        assetSearchJob?.cancel()
        applyFilters {
            it.copy(asset = asset, assetTerm = asset.label, assetResults = emptyList())
        }
    }

    fun clearAsset() {
        assetSearchJob?.cancel()
        applyFilters { it.copy(asset = null, assetTerm = "", assetResults = emptyList()) }
    }

    private fun fetch(page: Int, mode: FetchMode) {
        fetchJob?.cancel()
        fetchJob = viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = mode == FetchMode.INITIAL,
                    isRefreshing = mode == FetchMode.REFRESH,
                    isLoadingMore = mode == FetchMode.MORE,
                    error = null
                )
            }

            val result = documentRepository.getDocuments(
                page = page,
                limit = PAGE_SIZE,
                filters = buildFilters(_uiState.value)
            )

            when (result) {
                is Resource.Success -> _uiState.update { s ->
                    val response = result.data
                    s.copy(
                        documents = if (mode == FetchMode.MORE) s.documents + response.data else response.data,
                        page = response.page,
                        totalPages = response.totalPages,
                        total = response.total,
                        isLoading = false,
                        isRefreshing = false,
                        isLoadingMore = false
                    )
                }
                is Resource.Error -> _uiState.update {
                    it.copy(
                        isLoading = false,
                        isRefreshing = false,
                        isLoadingMore = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {}
            }
        }
    }

    private fun applyFilters(transform: (DocumentListUiState) -> DocumentListUiState) {
        _uiState.update { transform(it).copy(documents = emptyList()) }
        fetch(page = 1, mode = FetchMode.INITIAL)
    }

    fun refresh() = fetch(page = 1, mode = FetchMode.REFRESH)

    // Recarrega sem indicador (ao voltar de outra tela)
    fun reload() = fetch(page = 1, mode = FetchMode.SILENT)

    fun loadMore() {
        val s = _uiState.value
        if (s.isLoading || s.isLoadingMore || s.isRefreshing) return
        if (s.documents.isEmpty() || s.page >= s.totalPages) return
        fetch(page = s.page + 1, mode = FetchMode.MORE)
    }

    fun setStatus(status: DocumentStatus?) {
        if (_uiState.value.status == status) return
        applyFilters { it.copy(status = status) }
    }

    fun setType(type: DocumentType?) {
        if (_uiState.value.type == type) return
        applyFilters { it.copy(type = type) }
    }

    fun setStartDate(date: LocalDate?) {
        if (_uiState.value.startDate == date) return
        applyFilters { s ->
            val end = if (date != null && s.endDate != null && date.isAfter(s.endDate)) date else s.endDate
            s.copy(startDate = date, endDate = end)
        }
    }

    fun setEndDate(date: LocalDate?) {
        if (_uiState.value.endDate == date) return
        applyFilters { s ->
            val start = if (date != null && s.startDate != null && date.isBefore(s.startDate)) date else s.startDate
            s.copy(endDate = date, startDate = start)
        }
    }

    // days = 1 -> hoje; days = 7 -> hoje e os 6 dias anteriores
    fun setLastDays(days: Long) {
        val today = LocalDate.now()
        applyFilters { it.copy(startDate = today.minusDays(days - 1), endDate = today) }
    }

    fun clearDates() {
        applyFilters { it.copy(startDate = null, endDate = null) }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.update { it.copy(isLoggedOut = true) }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}