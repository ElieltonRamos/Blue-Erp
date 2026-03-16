package com.blue_erp.garcom_digital.ui.screens.tables

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blue_erp.garcom_digital.data.model.ProductionLocationResponse
import com.blue_erp.garcom_digital.data.model.TableResponse
import com.blue_erp.garcom_digital.data.model.TableStatus
import com.blue_erp.garcom_digital.data.repository.AuthRepository
import com.blue_erp.garcom_digital.data.repository.TableRepository
import com.blue_erp.garcom_digital.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TablesUiState(
    val tables: List<TableResponse> = emptyList(),
    val locations: List<ProductionLocationResponse> = emptyList(),
    val selectedLocationId: Int? = null,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val selectedTable: TableResponse? = null,
    val showOccupyDialog: Boolean = false,
    val showReserveDialog: Boolean = false,
    val showReleaseConfirmDialog: Boolean = false,
    val actionLoading: Boolean = false,
    val actionSuccess: String? = null,
    val isLoggedOut: Boolean = false,
    val navigateToTable: Int? = null  // tableId para navegar
)

@HiltViewModel
class TablesViewModel @Inject constructor(
    private val tableRepository: TableRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TablesUiState())
    val uiState: StateFlow<TablesUiState> = _uiState.asStateFlow()

    init {
        loadInitial()
    }

    private fun loadInitial() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val locationsResult = tableRepository.getLocations()
            val locations = if (locationsResult is Resource.Success) locationsResult.data else emptyList()
            val firstLocationId = locations.firstOrNull()?.id

            _uiState.value = _uiState.value.copy(
                locations = locations,
                selectedLocationId = firstLocationId ?: _uiState.value.selectedLocationId
            )

            when (val tablesResult = tableRepository.getTables(firstLocationId)) {
                is Resource.Success -> _uiState.value = _uiState.value.copy(
                    tables = tablesResult.data,
                    isLoading = false
                )
                is Resource.Error -> _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = tablesResult.message
                )
                is Resource.Loading -> {}
            }
        }
    }

    fun selectLocation(locationId: Int) {
        if (_uiState.value.selectedLocationId == locationId) return
        _uiState.value = _uiState.value.copy(selectedLocationId = locationId)
        loadTables()
    }

    fun loadTables() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            when (val result = tableRepository.getTables(_uiState.value.selectedLocationId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        tables = result.data,
                        isLoading = false
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun refreshTables() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true)

            when (val result = tableRepository.getTables(_uiState.value.selectedLocationId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        tables = result.data,
                        isRefreshing = false
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isRefreshing = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun onTableClick(table: TableResponse) {
        _uiState.value = _uiState.value.copy(selectedTable = table)

        when (table.status) {
            TableStatus.AVAILABLE -> {
                _uiState.value = _uiState.value.copy(showOccupyDialog = true)
            }
            TableStatus.OCCUPIED -> {
                _uiState.value = _uiState.value.copy(navigateToTable = table.id, selectedTable = null)
            }
            TableStatus.RESERVED -> {
                _uiState.value = _uiState.value.copy(showOccupyDialog = true)
            }
        }
    }

    fun clearNavigateToTable() {
        _uiState.value = _uiState.value.copy(navigateToTable = null)
    }

    fun onTableLongClick(table: TableResponse) {
        _uiState.value = _uiState.value.copy(selectedTable = table)

        when (table.status) {
            TableStatus.AVAILABLE -> {
                _uiState.value = _uiState.value.copy(showReserveDialog = true)
            }
            TableStatus.OCCUPIED -> {}
            TableStatus.RESERVED -> {
                _uiState.value = _uiState.value.copy(showReleaseConfirmDialog = true)
            }
        }
    }

    fun dismissDialogs() {
        _uiState.value = _uiState.value.copy(
            showOccupyDialog = false,
            showReserveDialog = false,
            showReleaseConfirmDialog = false,
            selectedTable = null
        )
    }

    fun occupyTable(customer: String) {
        val table = _uiState.value.selectedTable ?: return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(actionLoading = true)

            when (val result = tableRepository.occupyTable(table.id, customer)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        actionLoading = false,
                        showOccupyDialog = false,
                        selectedTable = null,
                        actionSuccess = "Mesa ${table.number} ocupada com sucesso"
                    )
                    loadTables()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        actionLoading = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun reserveTable(customer: String, time: String) {
        val table = _uiState.value.selectedTable ?: return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(actionLoading = true)

            when (val result = tableRepository.reserveTable(table.id, customer, time)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        actionLoading = false,
                        showReserveDialog = false,
                        selectedTable = null,
                        actionSuccess = "Mesa ${table.number} reservada para $time"
                    )
                    loadTables()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        actionLoading = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun releaseTable() {
        val table = _uiState.value.selectedTable ?: return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(actionLoading = true)

            when (val result = tableRepository.releaseTable(table.id)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        actionLoading = false,
                        showReleaseConfirmDialog = false,
                        selectedTable = null,
                        actionSuccess = "Mesa ${table.number} liberada"
                    )
                    loadTables()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        actionLoading = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = _uiState.value.copy(isLoggedOut = true)
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearActionSuccess() {
        _uiState.value = _uiState.value.copy(actionSuccess = null)
    }
}