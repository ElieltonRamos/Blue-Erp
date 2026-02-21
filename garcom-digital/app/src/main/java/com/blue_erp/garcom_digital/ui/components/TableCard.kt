package com.blue_erp.garcom_digital.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.TableBar
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.blue_erp.garcom_digital.data.model.TableResponse
import com.blue_erp.garcom_digital.data.model.TableStatus
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
                        text = "${table.order.items.size} itens",
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
    }
}

private fun formatCurrency(value: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    return format.format(value)
}
