package com.blue_erp.garcom_digital.ui.screens.order

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.data.repository.OrderRepository
import com.blue_erp.garcom_digital.data.repository.ProductRepository
import com.blue_erp.garcom_digital.data.repository.TableRepository
import com.blue_erp.garcom_digital.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderUiState(
    val table: TableResponse? = null,
    val order: TableOrder? = null,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val success: String? = null,
    val editedItems: List<TableOrderItem> = emptyList(),
    val hasUnsavedChanges: Boolean = false,
    val showProductSearch: Boolean = false,
    val productQuery: String = "",
    val products: List<ProductResponse> = emptyList(),
    val isSearchingProducts: Boolean = false,
    val showCloseTabDialog: Boolean = false,
    val shouldNavigateBack: Boolean = false,
    val isClosingTab: Boolean = false,
    val categories: List<CategoryResponse> = emptyList(),
    val selectedCategoryId: Int? = null,
)

@OptIn(FlowPreview::class)
@HiltViewModel
class OrderViewModel @Inject constructor(
    private val tableRepository: TableRepository,
    private val orderRepository: OrderRepository,
    private val productRepository: ProductRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val tableId: Int = checkNotNull(savedStateHandle["tableId"])

    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState: StateFlow<OrderUiState> = _uiState.asStateFlow()

    private val _productQuery = MutableStateFlow("")

    init {
        loadTable()
        loadCategories()
        viewModelScope.launch {
            _productQuery
                .debounce(400)
                .collectLatest { query -> searchProducts(query) }
        }
    }

    private fun loadCategories() {
        viewModelScope.launch {
            when (val result = productRepository.getCategories()) {
                is Resource.Success -> _uiState.update { it.copy(categories = result.data) }
                else -> {}
            }
        }
    }

    fun selectCategory(categoryId: Int?) {
        _uiState.update { it.copy(selectedCategoryId = categoryId) }
        viewModelScope.launch { searchProducts(_uiState.value.productQuery, categoryId) }
    }

    fun openCloseTabDialog() = _uiState.update { it.copy(showCloseTabDialog = true) }
    fun closeCloseTabDialog() = _uiState.update { it.copy(showCloseTabDialog = false) }

    fun closeTab() {
        viewModelScope.launch {
            _uiState.update { it.copy(isClosingTab = true, showCloseTabDialog = false, error = null) }
            when (val result = tableRepository.closeTab(tableId)) {
                is Resource.Success -> _uiState.update {
                    it.copy(isClosingTab = false, shouldNavigateBack = true)
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isClosingTab = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun loadTable() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = tableRepository.getTable(tableId)) {
                is Resource.Success -> {
                    val order = result.data.order
                    _uiState.update {
                        it.copy(
                            table = result.data,
                            order = order,
                            editedItems = order?.items?.toList() ?: emptyList(),
                            isLoading = false,
                            hasUnsavedChanges = false
                        )
                    }
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    // ── Edição de itens ────────────────────────────────────────────────────────

    fun incrementItem(itemId: Int) {
        updateItemQuantity(itemId) { it + 1.0 }
    }

    fun decrementItem(itemId: Int) {
        val item = _uiState.value.editedItems.find { it.id == itemId } ?: return
        if (item.quantity <= 1.0) removeItem(itemId)
        else updateItemQuantity(itemId) { it - 1.0 }
    }

    fun removeItem(itemId: Int) {
        _uiState.update {
            it.copy(
                editedItems = it.editedItems.filter { item -> item.id != itemId },
                hasUnsavedChanges = true
            )
        }
    }

    private fun updateItemQuantity(itemId: Int, transform: (Double) -> Double) {
        _uiState.update { state ->
            val updated = state.editedItems.map { item ->
                if (item.id == itemId) {
                    val newQty = transform(item.quantity)
                    item.copy(quantity = newQty, total = newQty * item.unitPrice)
                } else item
            }
            state.copy(editedItems = updated, hasUnsavedChanges = true)
        }
    }

    // ── Adicionar produto ──────────────────────────────────────────────────────

    fun addProduct(product: ProductResponse) {
        val existing = _uiState.value.editedItems.find { it.productId == product.id }
        if (existing != null) {
            updateItemQuantity(existing.id) { it + 1.0 }
        } else {
            val newItem = TableOrderItem(
                id = -(_uiState.value.editedItems.size + 1),
                code = product.code,
                name = product.name,
                quantity = 1.0,
                unitPrice = product.price,
                total = product.price,
                productId = product.id,
                productionLocation = ""
            )
            _uiState.update {
                it.copy(
                    editedItems = it.editedItems + newItem,
                    hasUnsavedChanges = true,
                    showProductSearch = false
                )
            }
        }
    }

    // ── Salvar ─────────────────────────────────────────────────────────────────

    fun saveChanges() {
        val orderId = _uiState.value.order?.id ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }

            val items = _uiState.value.editedItems.map { item ->
                UpdateOrderItemRequest(
                    id = if (item.id > 0) item.id else null,
                    productId = item.productId,
                    code = item.code,
                    name = item.name,
                    quantity = item.quantity,
                    unitPrice = item.unitPrice,
                    total = item.total
                )
            }
            val request = UpdateOrderRequest(items = items, total = items.sumOf { it.total })
            android.util.Log.d("OrderViewModel", "saveChanges → request items: ${items}")
            android.util.Log.d("OrderViewModel", "saveChanges → request: $request")

            when (val result = orderRepository.updateOrder(orderId, request)) {
                is Resource.Success -> {
                    Log.d("OrderViewModel", "saveChanges → success: ${result.data}")
                    _uiState.update {
                        it.copy(
                            order = result.data,
                            editedItems = result.data.items.toList(),
                            isSaving = false,
                            hasUnsavedChanges = false,
                            success = "Comanda salva"
                        )
                    }
                }
                is Resource.Error -> {
                    Log.e("OrderViewModel", "saveChanges → error: ${result.message}")
                    _uiState.update { it.copy(isSaving = false, error = result.message) }
                }
                is Resource.Loading -> {}
            }
        }
    }

    // ── Busca de produtos ──────────────────────────────────────────────────────

    fun openProductSearch() {
        _uiState.update { it.copy(showProductSearch = true, productQuery = "", products = emptyList(), selectedCategoryId = null) }
        viewModelScope.launch { searchProducts("") }
    }

    fun closeProductSearch() {
        _uiState.update { it.copy(showProductSearch = false) }
    }

    fun onProductQueryChange(query: String) {
        _uiState.update { it.copy(productQuery = query) }
        _productQuery.value = query
    }

    private fun searchProducts(query: String, categoryId: Int? = _uiState.value.selectedCategoryId) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSearchingProducts = true) }
            when (val result = productRepository.getProducts(search = query, categoryId = categoryId)) {
                is Resource.Success -> _uiState.update {
                    it.copy(products = result.data, isSearchingProducts = false)
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isSearchingProducts = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun clearError() = _uiState.update { it.copy(error = null) }
    fun clearSuccess() = _uiState.update { it.copy(success = null) }
}