package com.blue_erp.garcom_digital.ui.screens.order

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.blue_erp.garcom_digital.data.model.TableOrder
import com.blue_erp.garcom_digital.data.model.TableOrderItem
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme


private val previewItems = listOf(
    TableOrderItem(id = 1, code = "PROD-001", name = "Filé Mignon",       quantity = 2.0, unitPrice = 45.0, total = 90.0,  productId = 1, productionLocation = "asd"),
    TableOrderItem(id = 2, code = "PROD-002", name = "Refrigerante Lata", quantity = 3.0, unitPrice = 8.0,  total = 24.0,  productId = 2, productionLocation = "asd"),
    TableOrderItem(id = 3, code = "PROD-003", name = "Batata Frita",      quantity = 1.0, unitPrice = 22.0, total = 22.0,  productId = 3, productionLocation = "asd"),
)

private val previewOrder = TableOrder(
    id = 2, type = "DINE_IN", locationId = "CHURRASCARIA",
    customerName = "teste", status = "OPEN", total = 136.0,
    items = previewItems, createdAt = "2026-02-23T18:14:05.989Z"
)

@Preview(showBackground = true, showSystemUi = true, name = "Comanda – com itens")
@Composable
private fun OrderScreenPreview() {
    GarcomDigitalTheme {
        OrderScreenContent(
            uiState = OrderUiState(order = previewOrder, editedItems = previewItems),
            onBack = {}, onSave = {}, onObservationChange = {} as (Int, String) -> Unit,
            onIncrement = {}, onDecrement = {}, onRemove = {},
            onOpenProductSearch = {}, onCloseProductSearch = {},
            onProductQueryChange = {}, onAddProduct = {}, onCategorySelect = {},
            onCloseTab = {}, onCloseCloseTabDialog = {}, onOpenCloseTabDialog = {}, onCloseTabSummaryDialog = {},
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Comanda – vazia")
@Composable
private fun OrderScreenEmptyPreview() {
    GarcomDigitalTheme {
        OrderScreenContent(
            uiState = OrderUiState(order = previewOrder, editedItems = emptyList()),
            onBack = {}, onSave = {}, onObservationChange = {} as (Int, String) -> Unit,
            onIncrement = {}, onDecrement = {}, onRemove = {},
            onOpenProductSearch = {}, onCloseProductSearch = {},
            onProductQueryChange = {}, onAddProduct = {}, onOpenCloseTabDialog = {},
            onCloseCloseTabDialog = {}, onCloseTab = {}, onCategorySelect = {}, onCloseTabSummaryDialog = {},
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Comanda – carregando")
@Composable
private fun OrderScreenLoadingPreview() {
    GarcomDigitalTheme {
        OrderScreenContent(
            uiState = OrderUiState(isLoading = true),
            onBack = {}, onSave = {}, onObservationChange = {} as (Int, String) -> Unit,
            onIncrement = {}, onDecrement = {}, onRemove = {},
            onOpenProductSearch = {}, onCloseProductSearch = {},
            onProductQueryChange = {}, onAddProduct = {}, onCloseTab = {}, onCloseCloseTabDialog = {},
            onOpenCloseTabDialog = {}, onCategorySelect = {}, onCloseTabSummaryDialog = {},
        )
    }
}