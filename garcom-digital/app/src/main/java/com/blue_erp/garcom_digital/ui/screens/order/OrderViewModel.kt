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
    val showTabSummaryDialog: Boolean = false,
    val tabSummaryOrder: TableOrder? = null,
    val isLoadingTabSummary: Boolean = false,
    val serviceChargeEnabled: Boolean = false,
    val serviceChargeAmount: Double = 0.0,
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

    fun closeCloseTabDialog() = _uiState.update { it.copy(showCloseTabDialog = false) }

    fun closeTabSummaryDialog() {
        _uiState.update { it.copy(showTabSummaryDialog = false, tabSummaryOrder = null) }
    }

    fun openCloseTabDialog() {
        val orderId = _uiState.value.order?.id ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingTabSummary = true, showCloseTabDialog = false) }
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
                            hasUnsavedChanges = false
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
        val total = order.items.sumOf { it.total }
        val enabled = order.serviceCharge > 0.0
        val amount = if (enabled) order.serviceCharge else round2(total * 0.10)
        _uiState.update { it.copy(serviceChargeEnabled = enabled, serviceChargeAmount = amount) }
    }

    fun toggleServiceCharge() {
        val state = _uiState.value
        val nowEnabled = !state.serviceChargeEnabled
        if (!nowEnabled) {
            val zeroed = state.editedItems.map { it.copy(serviceCharge = 0.0) }
            _uiState.update {
                it.copy(serviceChargeEnabled = false, serviceChargeAmount = 0.0, editedItems = zeroed, hasUnsavedChanges = true)
            }
        } else {
            val default = round2(state.editedItems.sumOf { it.total } * 0.10)
            _uiState.update { it.copy(serviceChargeEnabled = true, serviceChargeAmount = default) }
            distributeServiceCharge()
        }
    }

    fun onServiceChargeAmountChange(value: Double) {
        val normalized = if (value <= 0.0) 0.0 else value
        _uiState.update {
            it.copy(
                serviceChargeAmount = normalized,
                serviceChargeEnabled = normalized > 0.0
            )
        }
        if (normalized > 0.0) distributeServiceCharge()
        else {
            val zeroed = _uiState.value.editedItems.map { it.copy(serviceCharge = 0.0) }
            _uiState.update { it.copy(editedItems = zeroed, hasUnsavedChanges = true) }
        }
    }

    private fun isDefaultServiceCharge(): Boolean {
        val state = _uiState.value
        val default = round2(state.editedItems.sumOf { it.total } * 0.10)
        return round2(state.serviceChargeAmount) == default
    }

    private fun distributeServiceCharge() {
        val state = _uiState.value

        if (!state.serviceChargeEnabled || state.serviceChargeAmount == 0.0) {
            val zeroed = state.editedItems.map { it.copy(serviceCharge = 0.0) }
            _uiState.update { it.copy(editedItems = zeroed, hasUnsavedChanges = true) }
            return
        }

        val updated = if (isDefaultServiceCharge()) {
            state.editedItems.map { item ->
                item.copy(serviceCharge = round2(item.total * 0.10))
            }
        } else {
            val perItem = round2(state.serviceChargeAmount / state.editedItems.size)
            state.editedItems.map { it.copy(serviceCharge = perItem) }
        }

        val totalServiceCharge = round2(updated.sumOf { it.serviceCharge })

        _uiState.update {
            it.copy(
                editedItems = updated,
                serviceChargeAmount = totalServiceCharge,
                hasUnsavedChanges = true
            )
        }
    }

    private fun recalculateServiceChargeAfterItemChange(previousTotal: Double) {
        val state = _uiState.value

        if (!state.serviceChargeEnabled && state.editedItems.size == 1) {
            val default = round2(state.editedItems.sumOf { it.total } * 0.10)
            _uiState.update {
                it.copy(serviceChargeEnabled = true, serviceChargeAmount = default)
            }
            distributeServiceCharge()
            return
        }

        if (!state.serviceChargeEnabled) return

        val wasDefault = round2(state.serviceChargeAmount) == round2(previousTotal * 0.10)
        if (wasDefault) {
            val newDefault = round2(state.editedItems.sumOf { it.total } * 0.10)
            _uiState.update { it.copy(serviceChargeAmount = newDefault) }
        }

        distributeServiceCharge()
    }

    private fun round2(value: Double): Double =
        value.toBigDecimal().setScale(2, RoundingMode.HALF_UP).toDouble()

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
        val previousTotal = _uiState.value.editedItems.sumOf { it.total }
        _uiState.update {
            it.copy(
                editedItems = it.editedItems.filter { item -> item.id != itemId },
                hasUnsavedChanges = true
            )
        }
        recalculateServiceChargeAfterItemChange(previousTotal)
    }

    private fun updateItemQuantity(itemId: Int, transform: (Double) -> Double) {
        val previousTotal = _uiState.value.editedItems.sumOf { it.total }
        _uiState.update { state ->
            val updated = state.editedItems.map { item ->
                if (item.id == itemId) {
                    val newQty = transform(item.quantity)
                    item.copy(quantity = newQty, total = newQty * item.unitPrice)
                } else item
            }
            state.copy(editedItems = updated, hasUnsavedChanges = true)
        }
        recalculateServiceChargeAfterItemChange(previousTotal)
    }

    fun updateObservation(itemId: Int, observation: String) {
        _uiState.update { state ->
            val updated = state.editedItems.map { item ->
                if (item.id == itemId) item.copy(observation = observation) else item
            }
            state.copy(editedItems = updated, hasUnsavedChanges = true)
        }
    }

    // ── Adicionar produto ──────────────────────────────────────────────────────

    fun addProduct(product: ProductResponse) {
        val previousTotal = _uiState.value.editedItems.sumOf { it.total }
        val existing = _uiState.value.editedItems.find { it.productId == product.id }
        if (existing != null) {
            updateItemQuantity(existing.id) { it + 1.0 }  // captura previousTotal internamente
        } else {
            val newItem = TableOrderItem(
                id = -(_uiState.value.editedItems.size + 1),
                code = product.code,
                name = product.name,
                quantity = 1.0,
                unitPrice = product.price,
                total = product.price,
                productId = product.id,
                productionLocation = "",
                observation = "",
                serviceCharge = 0.0,
            )
            _uiState.update {
                it.copy(
                    editedItems = it.editedItems + newItem,
                    hasUnsavedChanges = true,
                    showProductSearch = false
                )
            }
            recalculateServiceChargeAfterItemChange(previousTotal)
        }
    }

    // ── Salvar ─────────────────────────────────────────────────────────────────

    fun saveChanges() {
        val orderId = _uiState.value.order?.id ?: return
        val hasInvalid = _uiState.value.editedItems.any {
            it.observation.isNullOrBlank() || it.observation.trim().length < 2
        }
        if (hasInvalid) {
            _uiState.update { it.copy(error = "Preencha a observação de todos os itens (digite Ok se nao tiver)") }
            return
        }
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
                    total = item.total,
                    observation = item.observation,
                    serviceCharge = item.serviceCharge,
                )
            }

            val total = items.sumOf { it.total }
            val serviceCharge = if (_uiState.value.serviceChargeEnabled)
                _uiState.value.serviceChargeAmount else 0.0

            val request = UpdateOrderRequest(
                items = items,
                total = total,
                serviceCharge = serviceCharge
            )

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