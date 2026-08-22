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
import java.math.RoundingMode
import javax.inject.Inject

data class OrderUiState(
    val table: TableResponse? = null,
    val order: TableOrder? = null,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val success: String? = null,
    val editedItems: List<TableOrderItem> = emptyList(),
    val showProductSearch: Boolean = false,
    val productQuery: String = "",
    val products: List<ProductResponse> = emptyList(),
    val isSearchingProducts: Boolean = false,
    val shouldNavigateBack: Boolean = false,
    val isClosingTab: Boolean = false,
    val categories: List<CategoryResponse> = emptyList(),
    val selectedCategoryId: Int? = null,
    val showTabSummaryDialog: Boolean = false,
    val tabSummaryOrder: TableOrder? = null,
    val isLoadingTabSummary: Boolean = false,
    val serviceChargeEnabled: Boolean = false,
    val serviceChargeAmount: Double = 0.0,
    val showProductDetailSheet: Boolean = false,
    val selectedProduct: ProductResponse? = null,
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
    private val categoriesWithComplements = setOf(1, 2, 3)

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

    fun openProductDetail(product: ProductResponse) {
        _uiState.update {
            it.copy(showProductDetailSheet = true, selectedProduct = product)
        }
    }

    fun closeProductDetail() {
        _uiState.update {
            it.copy(showProductDetailSheet = false, selectedProduct = null)
        }
    }

    // ── Itens ──────────────────────────────────────────────────────────────────

    fun addProduct(product: ProductResponse, observation: String = "", quantity: Int = 1) {
        if (observation.isBlank() || observation.trim().length < 2) {
            _uiState.update { it.copy(error = "Informe uma observação para o item") }
            return
        }

        val orderId = _uiState.value.order?.id ?: return

        _uiState.update {
            it.copy(showProductDetailSheet = false, selectedProduct = null, showProductSearch = false)
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }

            val request = AddOrderItemsRequest(
                items = listOf(
                    AddOrderItemRequest(
                        productId = product.id,
                        code = product.code,
                        name = product.name,
                        quantity = quantity.toDouble(),
                        unitPrice = product.price,
                        observation = observation,
                    )
                )
            )

            when (val result = orderRepository.addItems(orderId, request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            order = result.data,
                            editedItems = result.data.items.toList(),
                            isSaving = false,
                            success = "${product.name} adicionado à comanda"
                        )
                    }
                    syncServiceChargeIfEnabled()
                }
                is Resource.Error -> _uiState.update { it.copy(isSaving = false, error = result.message) }
                is Resource.Loading -> {}
            }
        }
    }

    fun incrementItem(itemId: Int) {
        val item = _uiState.value.editedItems.find { it.id == itemId } ?: return
        val product = ProductResponse(
            id = item.productId,
            name = item.name,
            code = item.code,
            price = item.unitPrice,
            unit = "",
            active = true,
            categoryId = null
        )
        openProductDetail(product)
    }

    fun decrementItem(itemId: Int) {
        val item = _uiState.value.editedItems.find { it.id == itemId } ?: return
        removeItemQuantity(item, 1.0, "Quantidade atualizada")
    }

    fun removeItem(itemId: Int) {
        val item = _uiState.value.editedItems.find { it.id == itemId } ?: return
        removeItemQuantity(item, item.quantity, "Item removido")
    }

    private fun removeItemQuantity(item: TableOrderItem, quantity: Double, successMessage: String) {
        val orderId = _uiState.value.order?.id ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }

            val request = RemoveOrderItemsRequest(
                items = listOf(RemoveOrderItemRequest(id = item.id, quantity = quantity))
            )

            when (val result = orderRepository.removeItems(orderId, request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            order = result.data,
                            editedItems = result.data.items.toList(),
                            isSaving = false,
                            success = successMessage
                        )
                    }
                    syncServiceChargeIfEnabled()
                }
                is Resource.Error -> _uiState.update { it.copy(isSaving = false, error = result.message) }
                is Resource.Loading -> {}
            }
        }
    }

    fun selectCategory(categoryId: Int?) {
        _uiState.update { it.copy(selectedCategoryId = categoryId) }
        viewModelScope.launch { searchProducts(_uiState.value.productQuery, categoryId) }
    }

    // ── Fechamento de comanda ─────────────────────────────────────────────────

    fun closeTabSummaryDialog() {
        _uiState.update { it.copy(showTabSummaryDialog = false, tabSummaryOrder = null) }
    }

    fun openCloseTabDialog() {
        val orderId = _uiState.value.order?.id ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingTabSummary = true) }
            when (val result = orderRepository.getOrder(orderId)) {
                is Resource.Success -> _uiState.update {
                    it.copy(
                        isLoadingTabSummary = false,
                        tabSummaryOrder = result.data,
                        showTabSummaryDialog = true
                    )
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isLoadingTabSummary = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun closeTab(serviceCharge: Double) {
        viewModelScope.launch {
            _uiState.update { it.copy(isClosingTab = true, showTabSummaryDialog = false, error = null) }
            when (val result = tableRepository.closeTab(tableId, serviceCharge)) {
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
                        )
                    }
                    order?.let { initServiceCharge(it) }
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    // ── Gorjeta ────────────────────────────────────────────────────────────────

    private fun initServiceCharge(order: TableOrder) {
        _uiState.update {
            it.copy(
                serviceChargeEnabled = order.serviceCharge > 0.0,
                serviceChargeAmount = order.serviceCharge
            )
        }
    }

    fun toggleServiceCharge() {
        val nowEnabled = !_uiState.value.serviceChargeEnabled
        pushServiceCharge(nowEnabled)
    }

    private fun syncServiceChargeIfEnabled() {
        if (_uiState.value.serviceChargeEnabled) pushServiceCharge(enabled = true)
    }

    private fun pushServiceCharge(enabled: Boolean) {
        val orderId = _uiState.value.order?.id ?: return
        val amount = if (enabled) round2(_uiState.value.editedItems.sumOf { it.total } * 0.10) else 0.0

        viewModelScope.launch {
            val request = UpdateServiceChargeRequest(enabled = enabled, amount = amount)

            Log.d("OrderViewModel", "pushServiceCharge → enabled=$enabled amount=$amount")

            when (val result = orderRepository.updateServiceCharge(orderId, request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            order = result.data,
                            editedItems = result.data.items.toList(),
                            serviceChargeEnabled = result.data.serviceCharge > 0.0,
                            serviceChargeAmount = result.data.serviceCharge,
                        )
                    }
                }
                is Resource.Error -> _uiState.update { it.copy(error = result.message) }
                is Resource.Loading -> {}
            }
        }
    }

    private fun round2(value: Double): Double =
        value.toBigDecimal().setScale(2, RoundingMode.HALF_UP).toDouble()

    // ── Busca de produtos ──────────────────────────────────────────────────────

    fun openProductSearch() {
        _uiState.update {
            it.copy(showProductSearch = true, productQuery = "", products = emptyList(), selectedCategoryId = null)
        }
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