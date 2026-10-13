package com.blue_erp.mobile.ui.screens.oficina.detail_document

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blue_erp.mobile.data.model.UserResponse
import com.blue_erp.mobile.data.model.oficina.*
import com.blue_erp.mobile.data.repository.oficina.DocumentRepository
import com.blue_erp.mobile.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay

data class DocumentDetailUiState(
    val document: DocumentResponse? = null,
    val assetLabel: String? = null,
    val isLoading: Boolean = true,
    val isActionLoading: Boolean = false,
    val mechanics: List<UserResponse> = emptyList(),
    val users: List<UserResponse> = emptyList(),
    val error: String? = null,
    val message: String? = null,
    val editingItem: DocumentItemResponse? = null,
    val itemToRemove: DocumentItemResponse? = null,
    val showCancelDialog: Boolean = false,
    val showResponsibleDialog: Boolean = false,
    val showAddSheet: Boolean = false,
    val catalogResults: List<CatalogOption> = emptyList(),
    val isSearchingCatalog: Boolean = false,
)

@HiltViewModel
class DocumentDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val documentRepository: DocumentRepository
) : ViewModel() {

    private val documentId: Int = checkNotNull(savedStateHandle.get<Int>("documentId"))

    private val _uiState = MutableStateFlow(DocumentDetailUiState())
    val uiState: StateFlow<DocumentDetailUiState> = _uiState.asStateFlow()
    private companion object {
        const val SEARCH_DELAY_MS = 350L
    }

    private var catalogSearchJob: Job? = null

    init {
        load(showLoading = true)
        loadUsers()
    }

    private fun load(showLoading: Boolean) {
        viewModelScope.launch {
            if (showLoading) _uiState.update { it.copy(isLoading = true, error = null) }

            when (val result = documentRepository.getDocument(documentId)) {
                is Resource.Success -> {
                    _uiState.update { it.copy(document = result.data, isLoading = false) }
                    loadAssetLabel(result.data.assetId)
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    private suspend fun loadAssetLabel(assetId: Int?) {
        if (assetId == null || _uiState.value.assetLabel != null) return
        when (val result = documentRepository.getAsset(assetId)) {
            is Resource.Success -> _uiState.update { it.copy(assetLabel = result.data.label) }
            else -> {} // o veículo é só informativo
        }
    }

    private fun loadUsers() {
        viewModelScope.launch {
            when (val result = documentRepository.getUsers(active = null, role = "mechanic")) {
                is Resource.Success -> _uiState.update { it.copy(mechanics = result.data) }
                else -> {}
            }
        }
        viewModelScope.launch {
            when (val result = documentRepository.getUsers(active = true)) {
                is Resource.Success -> _uiState.update { it.copy(users = result.data) }
                else -> {}
            }
        }
    }

    // Toda ação devolve o documento atualizado, que substitui o estado
    private fun performAction(
        successMessage: String,
        block: suspend () -> Resource<DocumentResponse>
    ) {
        if (_uiState.value.isActionLoading) return
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, error = null) }
            when (val result = block()) {
                is Resource.Success -> _uiState.update {
                    it.copy(
                        document = result.data,
                        isActionLoading = false,
                        message = successMessage,
                        editingItem = null,
                        itemToRemove = null,
                        showCancelDialog = false,
                        showResponsibleDialog = false,
                        showAddSheet = false,
                        catalogResults = emptyList(),
                        isSearchingCatalog = false
                    )
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isActionLoading = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun openAddSheet() = _uiState.update { it.copy(showAddSheet = true, catalogResults = emptyList()) }

    fun closeAddSheet() {
        catalogSearchJob?.cancel()
        _uiState.update {
            it.copy(showAddSheet = false, catalogResults = emptyList(), isSearchingCatalog = false)
        }
    }

    fun searchCatalog(type: DocumentItemType, term: String) {
        catalogSearchJob?.cancel()
        val query = term.trim()
        if (query.isEmpty()) {
            _uiState.update { it.copy(catalogResults = emptyList(), isSearchingCatalog = false) }
            return
        }

        catalogSearchJob = viewModelScope.launch {
            delay(SEARCH_DELAY_MS)
            _uiState.update { it.copy(isSearchingCatalog = true) }

            val result = when (type) {
                DocumentItemType.PRODUCT -> documentRepository.searchProducts(query)
                DocumentItemType.SERVICE -> documentRepository.searchServices(query)
            }
            val options = when (result) {
                is Resource.Success -> result.data
                else -> emptyList()
            }
            _uiState.update { it.copy(catalogResults = options, isSearchingCatalog = false) }
        }
    }

    fun addItem(
        type: DocumentItemType,
        option: CatalogOption,
        quantity: Double,
        unitPrice: Double,
        userId: Int?
    ) = performAction("Item adicionado") {
        documentRepository.addItem(
            documentId,
            AddDocumentItemRequest(
                type = type,
                productId = if (type == DocumentItemType.PRODUCT) option.id else null,
                serviceId = if (type == DocumentItemType.SERVICE) option.id else null,
                userId = if (type == DocumentItemType.SERVICE) userId else null,
                quantity = quantity,
                unitPrice = unitPrice
            )
        )
    }

    fun refresh() = load(showLoading = false)

    fun approve() = performAction("Documento aprovado") { documentRepository.approve(documentId) }

    fun start() = performAction("OS iniciada") { documentRepository.start(documentId) }

    fun reopen() = performAction("Documento reaberto") { documentRepository.reopen(documentId) }

    fun confirmCancel() = performAction("Documento cancelado") { documentRepository.cancel(documentId) }

    fun selectResponsible(user: UserResponse) =
        performAction("Responsável atualizado") {
            documentRepository.updateResponsible(documentId, user.id)
        }

    fun saveItem(item: DocumentItemResponse, quantity: Double, unitPrice: Double, userId: Int?) =
        performAction("Item atualizado") {
            documentRepository.updateItem(
                documentId,
                item.id,
                UpdateDocumentItemRequest(quantity = quantity, unitPrice = unitPrice, userId = userId)
            )
        }

    fun confirmRemove() {
        val item = _uiState.value.itemToRemove ?: return
        performAction("Item removido") { documentRepository.removeItem(documentId, item.id) }
    }

    fun openEdit(item: DocumentItemResponse) = _uiState.update { it.copy(editingItem = item) }
    fun closeEdit() = _uiState.update { it.copy(editingItem = null) }
    fun askRemove(item: DocumentItemResponse) = _uiState.update { it.copy(itemToRemove = item) }
    fun dismissRemove() = _uiState.update { it.copy(itemToRemove = null) }
    fun askCancel() = _uiState.update { it.copy(showCancelDialog = true) }
    fun dismissCancel() = _uiState.update { it.copy(showCancelDialog = false) }
    fun askResponsible() = _uiState.update { it.copy(showResponsibleDialog = true) }
    fun dismissResponsible() = _uiState.update { it.copy(showResponsibleDialog = false) }
    fun clearError() = _uiState.update { it.copy(error = null) }
    fun clearMessage() = _uiState.update { it.copy(message = null) }
}