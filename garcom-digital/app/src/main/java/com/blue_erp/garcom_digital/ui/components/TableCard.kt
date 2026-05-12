package com.blue_erp.garcom_digital.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
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
import androidx.compose.ui.unit.sp
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

    Card(
        modifier = modifier
            .aspectRatio(1f)
            .combinedClickable(onClick = onClick, onLongClick = onLongClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        colors = CardDefaults.cardColors(containerColor = statusColor.copy(alpha = 0.12f)),
        border = androidx.compose.foundation.BorderStroke(1.5.dp, statusColor)
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(10.dp)) {

            // Número da mesa — destaque principal
            Column(modifier = Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "${table.number}",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = statusColor
                )
                if (table.customer != null) {
                    Text(
                        text = table.customer,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (table.status == TableStatus.RESERVED && table.time != null) {
                    Text(
                        text = table.time,
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor
                    )
                }
            }

            Row(
                modifier = Modifier.align(Alignment.BottomStart),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(11.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${table.capacity} Pessoas",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Total — canto inferior direito (se ocupada)
            if (table.status == TableStatus.OCCUPIED && table.order != null) {
                Text(
                    text = formatCurrency(table.order.total),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.align(Alignment.BottomEnd)
                )
            }

            // Badge itens prontos — canto superior direito
            if (table.hasReadyItems) {
                ReadyItemsBadge(
                    count = table.readyItemsCount,
                    modifier = Modifier.align(Alignment.TopEnd)
                )
            } else if (table.hasAlert) {
                AlertBadge(
                    alertLevel = table.alertLevel,
                    modifier = Modifier.align(Alignment.TopEnd)
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
    val (backgroundColor, icon, label) = when (alertLevel) {
        TableAlertLevel.WARNING -> Triple(Color(0xFFF59E0B), Icons.Default.Warning, "Alerta")
        TableAlertLevel.CRITICAL -> Triple(Color(0xFFDC2626), Icons.Default.ErrorOutline, "Urgente")
        TableAlertLevel.NONE -> return
    }

    Row(
        modifier = modifier
            .background(backgroundColor, RoundedCornerShape(12.dp))
            .padding(horizontal = 6.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(11.dp)
        )
        Text(
            text = label,
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
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
                            observation = null,
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
                            observation = null,
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
                            observation = null,
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
                            observation = null,
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
                            observation = null,
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