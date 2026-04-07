package com.blue_erp.garcom_digital.ui.screens.kitchen_display

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.TimeBadgeColor
import com.blue_erp.garcom_digital.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class KitchenDisplayViewModel @Inject constructor(
    private val kitchenService: KitchenService,
    private val locationsService: ProductionLocationsService,
    private val mediaPlayer: MediaPlayerHelper,
    private val prefs: SharedPreferences
) : ViewModel() {

    companion object {
        private const val KITCHEN_STORAGE_KEY = "default_kitchen"
        private const val REFRESH_INTERVAL_MS = 30_000L
        private const val TIME_UPDATE_INTERVAL_MS = 60_000L
    }

    private val _uiState = MutableStateFlow(KitchenDisplayUiState())
    val uiState: StateFlow<KitchenDisplayUiState> = _uiState.asStateFlow()

    init {
        loadKitchenConfig()
        loadKitchenOptions()
        setupAutoRefresh()
        setupTimeUpdates()
    }

    private fun loadKitchenConfig() {
        val saved = prefs.getString(KITCHEN_STORAGE_KEY, null)
        _uiState.update { it.copy(defaultKitchen = saved) }
    }

    private fun loadKitchenOptions() {
        viewModelScope.launch {
            when (val result = locationsService.getAll()) {
                is Resource.Success<*> -> {
                    _uiState.update {
                        it.copy(
                            kitchenOptions = listOf("Todas as cozinhas") + result.data.map { loc -> loc.name }
                        )
                    }
                    loadOrders()
                }
                is Resource.Error -> {
                    _uiState.update { it.copy(error = "Erro ao carregar locais: ${result.message}") }
                    loadOrders()
                }
                is Resource.Loading -> {}
            }
        }
    }

    private fun setupAutoRefresh() {
        viewModelScope.launch {
            while (isActive) {
                delay(REFRESH_INTERVAL_MS)
                loadOrders()
            }
        }
    }

    private fun setupTimeUpdates() {
        viewModelScope.launch {
            while (isActive) {
                delay(TIME_UPDATE_INTERVAL_MS)
                _uiState.update { it.copy(timeTick = System.currentTimeMillis()) }
            }
        }
    }

    fun loadOrders() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = kitchenService.getKitchenOrders(_uiState.value.defaultKitchen)) {
                is Resource.Success<*> -> {
                    val currentIds = _uiState.value.orders.map { it.productionId }.toSet()
                    val hasNew = result.data.any { it.productionId !in currentIds }
                    if (hasNew) mediaPlayer.playNotification()
                    _uiState.update { it.copy(orders = result.data, isLoading = false) }
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun saveKitchenConfig(kitchen: String) {
        if (kitchen == "Todas as cozinhas") {
            prefs.edit().remove(KITCHEN_STORAGE_KEY).apply()
            _uiState.update {
                it.copy(
                    defaultKitchen = null,
                    showKitchenConfigDialog = false,
                    success = "Exibindo pedidos de todas as cozinhas"
                )
            }
        } else {
            prefs.edit().putString(KITCHEN_STORAGE_KEY, kitchen).apply()
            _uiState.update {
                it.copy(
                    defaultKitchen = kitchen,
                    showKitchenConfigDialog = false,
                    success = "Cozinha padrão definida: $kitchen"
                )
            }
        }
        loadOrders()
    }

    fun startPreparing(item: KitchenOrderItem) {
        viewModelScope.launch {
            when (val result = kitchenService.startPreparingItem(item.productionId)) {
                is Resource.Success<*> -> {
                    _uiState.update { it.copy(success = "Preparo iniciado!") }
                    loadOrders()
                }
                is Resource.Error -> _uiState.update { it.copy(error = result.message) }
                is Resource.Loading -> {}
            }
        }
    }

    fun markAsReady(item: KitchenOrderItem) {
        viewModelScope.launch {
            when (val result = kitchenService.completeItem(item.productionId)) {
                is Resource.Success<*> -> {
                    _uiState.update { it.copy(success = "Item marcado como pronto!") }
                    loadOrders()
                }
                is Resource.Error -> _uiState.update { it.copy(error = result.message) }
                is Resource.Loading -> {}
            }
        }
    }

    fun completeOrder(item: KitchenOrderItem) {
        viewModelScope.launch {
            when (val result = kitchenService.deliverItem(item.productionId)) {
                is Resource.Success<*> -> {
                    _uiState.update { it.copy(success = "Item entregue!") }
                    loadOrders()
                }
                is Resource.Error -> _uiState.update { it.copy(error = result.message) }
                is Resource.Loading -> {}
            }
        }
    }

    fun cancelOrder(item: KitchenOrderItem) {
        viewModelScope.launch {
            when (val result = kitchenService.cancelProduction(item.productionId)) {
                is Resource.Success<*> -> {
                    _uiState.update { it.copy(success = "Item cancelado!", cancelConfirmItem = null) }
                    loadOrders()
                }
                is Resource.Error -> _uiState.update {
                    it.copy(error = result.message, cancelConfirmItem = null)
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun openKitchenConfigDialog() = _uiState.update { it.copy(showKitchenConfigDialog = true) }
    fun closeKitchenConfigDialog() = _uiState.update { it.copy(showKitchenConfigDialog = false) }
    fun openCancelConfirm(item: KitchenOrderItem) = _uiState.update { it.copy(cancelConfirmItem = item) }
    fun closeCancelConfirm() = _uiState.update { it.copy(cancelConfirmItem = null) }

    fun getElapsedMinutes(item: KitchenOrderItem): Int {
        val diff = System.currentTimeMillis() - item.pendingAt.time
        return (diff / 60_000).toInt()
    }

    fun getTimeBadgeColor(minutes: Int): TimeBadgeColor = when {
        minutes < 10 -> TimeBadgeColor.GREEN
        minutes < 20 -> TimeBadgeColor.YELLOW
        else         -> TimeBadgeColor.RED
    }

    fun clearError() = _uiState.update { it.copy(error = null) }
    fun clearSuccess() = _uiState.update { it.copy(success = null) }
}