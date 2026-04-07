package com.blue_erp.garcom_digital.ui.screens.kitchen_display

import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.ProductionStatus

data class KitchenDisplayUiState(
    val orders: List<KitchenOrderItem> = emptyList(),
    val kitchenOptions: List<String> = listOf("Todas as cozinhas"),
    val defaultKitchen: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: String? = null,
    val showKitchenConfigDialog: Boolean = false,
    val cancelConfirmItem: KitchenOrderItem? = null,
    val timeTick: Long = 0L
) {
    val pendingOrders get() = orders
        .filter { it.productionStatus == ProductionStatus.PENDING }
        .sortedBy { it.pendingAt }

    val preparingOrders get() = orders
        .filter { it.productionStatus == ProductionStatus.IN_PROGRESS }
        .sortedBy { it.pendingAt }

    val readyOrders get() = orders
        .filter { it.productionStatus == ProductionStatus.COMPLETED }
        .sortedBy { it.pendingAt }

    val totalItems get() = orders.size
}