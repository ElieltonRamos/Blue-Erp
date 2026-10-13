package com.blue_erp.mobile.ui.screens.oficina.create_document

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blue_erp.mobile.data.model.UserResponse
import com.blue_erp.mobile.data.model.oficina.*
import com.blue_erp.mobile.data.repository.oficina.DocumentRepository
import com.blue_erp.mobile.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DocumentCreateUiState(
    val type: DocumentType = DocumentType.QUOTE,
    val clientTerm: String = "",
    val clientResults: List<ClientResponse> = emptyList(),
    val client: ClientResponse? = null,
    val assets: List<AssetResponse> = emptyList(),
    val isLoadingAssets: Boolean = false,
    val asset: AssetResponse? = null,
    val users: List<UserResponse> = emptyList(),
    val responsible: UserResponse? = null,
    val isCreating: Boolean = false,
    val error: String? = null,
    val createdDocumentId: Int? = null
)

@HiltViewModel
class DocumentCreateViewModel @Inject constructor(
    private val documentRepository: DocumentRepository
) : ViewModel() {

    private companion object {
        const val SEARCH_DELAY_MS = 350L
        const val MAX_SUGGESTIONS = 5
    }

    private val _uiState = MutableStateFlow(DocumentCreateUiState())
    val uiState: StateFlow<DocumentCreateUiState> = _uiState.asStateFlow()

    private var clientSearchJob: Job? = null

    init {
        loadUsers()
    }

    private fun loadUsers() {
        viewModelScope.launch {
            when (val result = documentRepository.getUsers()) {
                is Resource.Success -> _uiState.update { it.copy(users = result.data) }
                is Resource.Error -> {} // responsável é opcional; a lista fica só com "Nenhum"
                is Resource.Loading -> {}
            }
        }
    }

    fun setType(type: DocumentType) {
        _uiState.update { it.copy(type = type) }
    }

    fun onClientTermChange(term: String) {
        clientSearchJob?.cancel()
        _uiState.update {
            it.copy(
                clientTerm = term,
                client = null,
                clientResults = emptyList(),
                assets = emptyList(),
                asset = null,
                isLoadingAssets = false
            )
        }

        val query = term.trim()
        if (query.isEmpty()) return

        clientSearchJob = viewModelScope.launch {
            delay(SEARCH_DELAY_MS)
            val results = when (val result = documentRepository.searchClients(query)) {
                is Resource.Success -> result.data.take(MAX_SUGGESTIONS)
                else -> emptyList()
            }
            _uiState.update { it.copy(clientResults = results) }
        }
    }

    fun clearClient() = onClientTermChange("")

    fun selectClient(client: ClientResponse) {
        clientSearchJob?.cancel()
        _uiState.update {
            it.copy(
                client = client,
                clientTerm = client.name,
                clientResults = emptyList(),
                assets = emptyList(),
                asset = null,
                isLoadingAssets = true
            )
        }

        viewModelScope.launch {
            val result = documentRepository.getAssets(clientId = client.id)
            _uiState.update { s ->
                if (s.client?.id != client.id) return@update s // cliente mudou durante a busca
                when (result) {
                    is Resource.Success -> s.copy(assets = result.data.data, isLoadingAssets = false)
                    is Resource.Error -> s.copy(isLoadingAssets = false, error = result.message)
                    is Resource.Loading -> s
                }
            }
        }
    }

    fun selectAsset(asset: AssetResponse?) {
        _uiState.update { it.copy(asset = asset) }
    }

    fun selectResponsible(user: UserResponse?) {
        _uiState.update { it.copy(responsible = user) }
    }

    fun create() {
        val s = _uiState.value
        if (s.isCreating) return

        val client = s.client
        if (client == null) {
            _uiState.update { it.copy(error = "Selecione o cliente.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isCreating = true, error = null) }

            val request = CreateDocumentRequest(
                type = s.type,
                clientId = client.id,
                assetId = s.asset?.id,
                responsibleId = s.responsible?.id
            )

            when (val result = documentRepository.createDocument(request)) {
                is Resource.Success -> _uiState.update {
                    it.copy(isCreating = false, createdDocumentId = result.data.id)
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isCreating = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun consumeCreated() {
        _uiState.update { it.copy(createdDocumentId = null) }
    }
}