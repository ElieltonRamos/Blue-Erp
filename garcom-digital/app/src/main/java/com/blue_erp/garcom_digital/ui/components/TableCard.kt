package com.blue_erp.garcom_digital.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.TableBar
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.blue_erp.garcom_digital.data.config.TableAlertConfig
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme
import com.blue_erp.garcom_digital.ui.theme.TableAvailable
import com.blue_erp.garcom_digital.ui.theme.TableOccupied
import com.blue_erp.garcom_digital.ui.theme.TableReserved
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun TableCard(
    table: TableResponse,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val statusColor = when (table.status) {
        TableStatus.AVAILABLE -> TableAvailable
        TableStatus.OCCUPIED -> TableOccupied
        TableStatus.RESERVED -> TableReserved
    }

    val statusText = when (table.status) {
        TableStatus.AVAILABLE -> "Disponível"
        TableStatus.OCCUPIED -> "Ocupada"
        TableStatus.RESERVED -> "Reservada"
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = onClick,
                onLongClick = onLongClick
            ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Ícone com cor do status
                Surface(
                    modifier = Modifier.size(48.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = statusColor.copy(alpha = 0.15f)
                ) {
                    Icon(
                        imageVector = Icons.Default.TableBar,
                        contentDescription = null,
                        modifier = Modifier
                            .padding(12.dp)
                            .fillMaxSize(),
                        tint = statusColor
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                // Informações da mesa
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Mesa ${table.number}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Surface(
                            shape = MaterialTheme.shapes.small,
                            color = statusColor
                        ) {
                            Text(
                                text = statusText,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = table.location.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (table.customer != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = table.customer,
                            style = MaterialTheme.typography.bodyMedium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    if (table.status == TableStatus.RESERVED && table.time != null) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Reserva: ${table.time}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TableReserved
                        )
                    }

                    // ✅ ALERTAS DE MESA
                    if (table.hasAlert) {
                        Spacer(modifier = Modifier.height(8.dp))

                        val (backgroundColor, textColor) = when (table.alertLevel) {
                            TableAlertLevel.WARNING ->
                                Color(TableAlertConfig.Colors.WARNING_BACKGROUND) to
                                        Color(TableAlertConfig.Colors.WARNING_TEXT)
                            TableAlertLevel.CRITICAL ->
                                Color(TableAlertConfig.Colors.CRITICAL_BACKGROUND) to
                                        Color(TableAlertConfig.Colors.CRITICAL_TEXT)
                            TableAlertLevel.NONE ->
                                Color.Transparent to Color.Transparent
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier
                                .background(
                                    color = backgroundColor,
                                    shape = MaterialTheme.shapes.small
                                )
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(
                                imageVector = when (table.alertLevel) {
                                    TableAlertLevel.WARNING -> Icons.Default.Warning
                                    TableAlertLevel.CRITICAL -> Icons.Default.ErrorOutline
                                    TableAlertLevel.NONE -> Icons.Default.Info
                                },
                                contentDescription = null,
                                tint = textColor,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = table.alertMessage,
                                style = MaterialTheme.typography.bodySmall,
                                color = textColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // ✅ Badge de itens prontos (texto)
                    if (table.hasReadyItems) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "${table.readyItemsCount} ${
                                    if (table.readyItemsCount == 1) "pronto" else "prontos"
                                }",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Total da comanda (se ocupada)
                if (table.status == TableStatus.OCCUPIED && table.order != null) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = formatCurrency(table.order.total),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "${table.order.items.size} ${
                                if (table.order.items.size == 1) "item" else "itens"
                            }",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Capacidade (se disponível)
                if (table.status == TableStatus.AVAILABLE) {
                    Text(
                        text = "${table.capacity} lugares",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // ✅ Badge de alerta no canto (só aparece se tiver alerta e NÃO tiver itens prontos)
            if (table.hasAlert && !table.hasReadyItems) {
                AlertBadge(
                    alertLevel = table.alertLevel,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                )
            }

            // ✅ Badge de itens prontos no canto (prioridade sobre alerta)
            if (table.hasReadyItems) {
                ReadyItemsBadge(
                    count = table.readyItemsCount,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                )
            }
        }
    }
}

@Composable
fun AlertBadge(
    alertLevel: TableAlertLevel,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, icon) = when (alertLevel) {
        TableAlertLevel.WARNING ->
            Color(TableAlertConfig.Colors.WARNING_TEXT) to Icons.Default.Warning
        TableAlertLevel.CRITICAL ->
            Color(TableAlertConfig.Colors.CRITICAL_TEXT) to Icons.Default.ErrorOutline
        TableAlertLevel.NONE -> return
    }

    Box(
        modifier = modifier
            .size(24.dp)
            .background(
                color = backgroundColor,
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = "Alerta",
            tint = Color.White,
            modifier = Modifier.size(14.dp)
        )
    }
}

private fun formatCurrency(value: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    return format.format(value)
}

@Preview(name = "Mesa Disponível", showBackground = true)
@Composable
private fun TableCardAvailablePreview() {
    GarcomDigitalTheme {
        TableCard(
            table = TableResponse(
                id = 1,
                number = 5,
                capacity = 4,
                status = TableStatus.AVAILABLE,
                customer = null,
                time = null,
                locationId = 1,
                location = TableLocation(1, "SALAO", "Salão Principal"),
                orderId = null,
                order = null,
                createdAt = "2024-02-24T10:00:00Z",
                updatedAt = "2024-02-24T10:00:00Z"
            ),
            onClick = {},
            onLongClick = {}
        )
    }
}

@Preview(name = "Mesa Ocupada - Sem Itens Prontos", showBackground = true)
@Composable
private fun TableCardOccupiedPreview() {
    GarcomDigitalTheme {
        TableCard(
            table = TableResponse(
                id = 2,
                number = 8,
                capacity = 6,
                status = TableStatus.OCCUPIED,
                customer = "João Silva",
                time = null,
                locationId = 1,
                location = TableLocation(1, "SALAO", "Salão Principal"),
                orderId = 1,
                order = TableOrder(
                    id = 1,
                    type = "DINE_IN",
                    locationId = "SALAO",
                    customerName = "João Silva",
                    status = "OPEN",
                    total = 127.50,
                    items = listOf(
                        TableOrderItem(
                            id = 1,
                            code = "PROD001",
                            name = "Pizza Margherita",
                            quantity = 2.0,
                            unitPrice = 45.0,
                            total = 90.0,
                            productId = 1,
                            observations = null,
                            productionLocation = "COZINHA",
                            sentToKitchenAt = "2024-02-24T10:15:00Z",
                            kitchenReadyAt = null,
                            deliveredAt = null,
                            canceledAt = null,
                            productions = emptyList()
                        ),
                        TableOrderItem(
                            id = 2,
                            code = "PROD002",
                            name = "Refrigerante",
                            quantity = 3.0,
                            unitPrice = 12.5,
                            total = 37.5,
                            productId = 2,
                            observations = null,
                            productionLocation = "BAR",
                            sentToKitchenAt = "2024-02-24T10:15:00Z",
                            kitchenReadyAt = null,
                            deliveredAt = null,
                            canceledAt = null,
                            productions = emptyList()
                        )
                    ),
                    createdAt = "2024-02-24T10:10:00Z"
                ),
                createdAt = "2024-02-24T10:00:00Z",
                updatedAt = "2024-02-24T10:10:00Z"
            ),
            onClick = {},
            onLongClick = {}
        )
    }
}

@Preview(name = "Mesa Ocupada - COM Itens Prontos 🔔", showBackground = true)
@Composable
private fun TableCardOccupiedWithReadyItemsPreview() {
    GarcomDigitalTheme {
        TableCard(
            table = TableResponse(
                id = 3,
                number = 12,
                capacity = 4,
                status = TableStatus.OCCUPIED,
                customer = "Maria Santos",
                time = null,
                locationId = 2,
                location = TableLocation(2, "JAPONESA", "Cozinha Japonesa"),
                orderId = 2,
                order = TableOrder(
                    id = 2,
                    type = "DINE_IN",
                    locationId = "JAPONESA",
                    customerName = "Maria Santos",
                    status = "OPEN",
                    total = 98.0,
                    items = listOf(
                        TableOrderItem(
                            id = 3,
                            code = "PROD003",
                            name = "Sushi Salmão",
                            quantity = 1.0,
                            unitPrice = 65.0,
                            total = 65.0,
                            productId = 3,
                            observations = null,
                            productionLocation = "JAPONESA",
                            sentToKitchenAt = "2024-02-24T10:20:00Z",
                            kitchenReadyAt = "2024-02-24T10:35:00Z",
                            deliveredAt = null,
                            canceledAt = null,
                            productions = listOf(
                                OrderProduction(
                                    id = 1,
                                    productionLocation = "JAPONESA",
                                    status = "COMPLETED",
                                    quantityRequested = 1.0,
                                    quantityProduced = 1.0,
                                    pendingAt = "2024-02-24T10:20:00Z",
                                    startedAt = "2024-02-24T10:25:00Z",
                                    completedAt = "2024-02-24T10:35:00Z",
                                    deliveredAt = null
                                )
                            )
                        ),
                        TableOrderItem(
                            id = 4,
                            code = "PROD004",
                            name = "Cerveja",
                            quantity = 2.0,
                            unitPrice = 16.5,
                            total = 33.0,
                            productId = 4,
                            observations = null,
                            productionLocation = "BAR",
                            sentToKitchenAt = "2024-02-24T10:20:00Z",
                            kitchenReadyAt = "2024-02-24T10:25:00Z",
                            deliveredAt = null,
                            canceledAt = null,
                            productions = listOf(
                                OrderProduction(
                                    id = 2,
                                    productionLocation = "BAR",
                                    status = "COMPLETED",
                                    quantityRequested = 2.0,
                                    quantityProduced = 2.0,
                                    pendingAt = "2024-02-24T10:20:00Z",
                                    startedAt = "2024-02-24T10:22:00Z",
                                    completedAt = "2024-02-24T10:25:00Z",
                                    deliveredAt = null
                                )
                            )
                        )
                    ),
                    createdAt = "2024-02-24T10:18:00Z"
                ),
                createdAt = "2024-02-24T10:00:00Z",
                updatedAt = "2024-02-24T10:18:00Z"
            ),
            onClick = {},
            onLongClick = {}
        )
    }
}

@Preview(name = "Mesa Reservada", showBackground = true)
@Composable
private fun TableCardReservedPreview() {
    GarcomDigitalTheme {
        TableCard(
            table = TableResponse(
                id = 4,
                number = 3,
                capacity = 2,
                status = TableStatus.RESERVED,
                customer = "Ana Costa",
                time = "20:00",
                locationId = 1,
                location = TableLocation(1, "SALAO", "Salão Principal"),
                orderId = null,
                order = null,
                createdAt = "2024-02-24T10:00:00Z",
                updatedAt = "2024-02-24T15:30:00Z"
            ),
            onClick = {},
            onLongClick = {}
        )
    }
}

@Preview(name = "Mesa com MUITOS Itens Prontos (9+)", showBackground = true)
@Composable
private fun TableCardWithManyReadyItemsPreview() {
    GarcomDigitalTheme {
        TableCard(
            table = TableResponse(
                id = 5,
                number = 15,
                capacity = 8,
                status = TableStatus.OCCUPIED,
                customer = "Festa de Aniversário",
                time = null,
                locationId = 1,
                location = TableLocation(1, "SALAO", "Salão Principal"),
                orderId = 3,
                order = TableOrder(
                    id = 3,
                    type = "DINE_IN",
                    locationId = "SALAO",
                    customerName = "Festa de Aniversário",
                    status = "OPEN",
                    total = 450.0,
                    items = List(12) { index ->
                        TableOrderItem(
                            id = 10 + index,
                            code = "PROD${100 + index}",
                            name = "Item ${index + 1}",
                            quantity = 1.0,
                            unitPrice = 37.5,
                            total = 37.5,
                            productId = 100 + index,
                            observations = null,
                            productionLocation = "COZINHA",
                            sentToKitchenAt = "2024-02-24T10:00:00Z",
                            kitchenReadyAt = "2024-02-24T10:30:00Z",
                            deliveredAt = null,
                            canceledAt = null,
                            productions = listOf(
                                OrderProduction(
                                    id = 100 + index,
                                    productionLocation = "COZINHA",
                                    status = "COMPLETED",
                                    quantityRequested = 1.0,
                                    quantityProduced = 1.0,
                                    pendingAt = "2024-02-24T10:00:00Z",
                                    startedAt = "2024-02-24T10:15:00Z",
                                    completedAt = "2024-02-24T10:30:00Z",
                                    deliveredAt = null
                                )
                            )
                        )
                    },
                    createdAt = "2024-02-24T09:50:00Z"
                ),
                createdAt = "2024-02-24T09:45:00Z",
                updatedAt = "2024-02-24T09:50:00Z"
            ),
            onClick = {},
            onLongClick = {}
        )
    }
}

@Preview(name = "Mesa SEM Pedidos ⚠️ (Warning)", showBackground = true)
@Composable
private fun TableCardWithoutOrdersWarningPreview() {
    GarcomDigitalTheme {
        TableCard(
            table = TableResponse(
                id = 6,
                number = 7,
                capacity = 4,
                status = TableStatus.OCCUPIED,
                customer = "Carlos Mendes",
                time = null,
                locationId = 1,
                location = TableLocation(1, "SALAO", "Salão Principal"),
                orderId = 4,
                order = TableOrder(
                    id = 4,
                    type = "DINE_IN",
                    locationId = "SALAO",
                    customerName = "Carlos Mendes",
                    status = "OPEN",
                    total = 0.0,
                    items = emptyList(),  // ⚠️ SEM ITENS!
                    createdAt = "2024-02-24T10:00:00.000Z"  // Há 12 min atrás (simulado)
                ),
                createdAt = "2024-02-24T10:00:00Z",
                updatedAt = "2024-02-24T10:00:00Z"
            ),
            onClick = {},
            onLongClick = {}
        )
    }
}