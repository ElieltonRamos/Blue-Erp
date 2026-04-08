package com.blue_erp.garcom_digital.ui.screens.kitchen_display

import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.tooling.preview.Preview
import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.ProductionStatus
import com.blue_erp.garcom_digital.data.model.TimeBadgeColor
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme
import java.util.Date

private fun fakeItem(
    id: Int,
    name: String,
    status: ProductionStatus,
    table: String,
    minutesAgo: Long = 5
) = KitchenOrderItem(
    id = id,
    productId = id,
    name = name,
    code = "PRD-$id",
    quantity = id,
    observation = if (id % 2 == 0) "Sem cebola" else null,
    notes = null,
    productionId = id,
    productionStatus = status,
    productionLocation = "LOCAL_01",
    pendingAt = Date(System.currentTimeMillis() - minutesAgo * 60_000),
    orderId = 100 + id,
    orderNumber = "${100 + id}",
    table = table,
    customerName = "Cliente $id",
    type = "dine_in",
    kitchen = "Cozinha 1"
)

private val previewUiState = KitchenDisplayUiState(
    orders = listOf(
        fakeItem(1, "X-Burguer", ProductionStatus.PENDING, "Mesa 1", minutesAgo = 3),
        fakeItem(2, "Frango Grelhado", ProductionStatus.PENDING, "Mesa 2", minutesAgo = 22),
        fakeItem(3, "Batata Frita", ProductionStatus.IN_PROGRESS, "Mesa 3", minutesAgo = 8),
        fakeItem(4, "Suco de Laranja", ProductionStatus.IN_PROGRESS, "Mesa 4", minutesAgo = 15),
        fakeItem(5, "Picanha", ProductionStatus.COMPLETED, "Mesa 5", minutesAgo = 1),
        fakeItem(6, "Refrigerante", ProductionStatus.COMPLETED, "Mesa 6", minutesAgo = 12),
    ),
    kitchenOptions = listOf("Todas as cozinhas", "Cozinha 1", "Cozinha 2"),
    defaultKitchen = null,
    isLoading = false
)

@Preview(
    name = "KDS - Celular (Portrait)",
    showBackground = true,
    widthDp = 360, // Força o layout Mobile/Tabs
    heightDp = 800,
    device = "spec:width=360dp,height=800dp,dpi=440"
)
@Composable
private fun KitchenDisplayPreviewMobile() {
    GarcomDigitalTheme {
        KitchenDisplayContent(
            uiState = previewUiState,
            snackbarHostState = remember { SnackbarHostState() },
            onStartPreparing = {},
            onMarkAsReady = {},
            onCompleteOrder = {},
            onOpenKitchenConfig = {},
            onCloseKitchenConfig = {},
            onSaveKitchenConfig = {},
            onRefresh = {},
            onLogout = {},
            onNavigateToTables = {},
            getElapsedMinutes = { item ->
                // Mock de cálculo de minutos para o preview
                val diff = System.currentTimeMillis() - item.pendingAt.time
                (diff / 60_000).toInt()
            },
            getTimeBadgeColor = { minutes ->
                when {
                    minutes < 10 -> TimeBadgeColor.GREEN
                    minutes < 20 -> TimeBadgeColor.YELLOW
                    else -> TimeBadgeColor.RED
                }
            },
        )
    }
}

@Preview(
    name = "KDS - TV 1080p",
    widthDp = 1920,
    heightDp = 1080,
    showBackground = true
)
@Composable
private fun KitchenDisplayPreviewTV1080() {
    GarcomDigitalTheme {
        KitchenDisplayContent(
            uiState = previewUiState,
            snackbarHostState = remember { SnackbarHostState() },
            onStartPreparing = {},
            onMarkAsReady = {},
            onCompleteOrder = {},
            onOpenKitchenConfig = {},
            onCloseKitchenConfig = {},
            onSaveKitchenConfig = {},
            onRefresh = {},
            onLogout = {},
            onNavigateToTables = {},
            getElapsedMinutes = { item ->
                ((System.currentTimeMillis() - item.pendingAt.time) / 60_000).toInt()
            },
            getTimeBadgeColor = { minutes ->
                when {
                    minutes < 10 -> TimeBadgeColor.GREEN
                    minutes < 20 -> TimeBadgeColor.YELLOW
                    else -> TimeBadgeColor.RED
                }
            },
        )
    }
}