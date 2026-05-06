package com.blue_erp.garcom_digital.ui.screens.order.components

import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.blue_erp.garcom_digital.data.model.TableOrder
import com.blue_erp.garcom_digital.data.model.TableOrderItem
import java.text.NumberFormat
import java.util.Locale

@Composable
fun TabSummaryDialog(
    order: TableOrder,
    isClosingTab: Boolean,
    onConfirm: (serviceCharge: Double) -> Unit,
    onDismiss: () -> Unit
) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    var applyServiceCharge by remember { mutableStateOf(order.serviceCharge > 0.0) }
    val serviceCharge = if (applyServiceCharge) order.total * 0.10 else 0.0
    val grandTotal = order.total + serviceCharge

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Resumo da Comanda") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                order.customerName?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
                HorizontalDivider()
                LazyColumn(modifier = Modifier.heightIn(max = 400.dp)) {
                    items(order.items) { item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${item.quantity.let { if (it % 1.0 == 0.0) it.toInt().toString() else String.format("%.2f", it) }}x ${item.name}",
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = currencyFormat.format(item.total),
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Subtotal", fontWeight = FontWeight.Medium)
                            Text(currencyFormat.format(order.total), fontWeight = FontWeight.Medium)
                        }
                    }
                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Taxa de Serviço (10%)", fontWeight = FontWeight.Medium)
                                if (applyServiceCharge) {
                                    Text(
                                        text = currencyFormat.format(serviceCharge),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Switch(
                                checked = applyServiceCharge,
                                onCheckedChange = { applyServiceCharge = it }
                            )
                        }
                    }
                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Total", fontWeight = FontWeight.Bold)
                            Text(currencyFormat.format(grandTotal), fontWeight = FontWeight.Bold)
                        }
                    }
                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                        Surface(
                            color = Color(0xFFF5F5F5),
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "⚠️ Orientações",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF424242)
                                )
                                Text(
                                    text = "1. Receba o pagamento do cliente na mesa\n" +
                                            "2. Feche a comanda no aplicativo\n" +
                                            "3. Vá até o caixa para conferência\n" +
                                            "4. O caixa finaliza a venda\n" +
                                            "\n" +
                                            "Ao fechar, a comanda ficará com status FECHADA, a mesa será liberada e o caixa deverá registrar o pagamento.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF616161)
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(serviceCharge) },
                enabled = !isClosingTab,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                if (isClosingTab) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onError
                    )
                } else {
                    Text("Fechar Comanda")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun TabSummaryDialogPreview() {
    val mockOrder = TableOrder(
        id = 1,
        type = "DINE_IN",
        locationId = "JAPONESA",
        customerName = "Eli",
        status = "OPEN",
        total = 77.0,
        items = listOf(
            TableOrderItem(
                id = 1,
                code = "PROD003",
                name = "Picanha na Brasa",
                quantity = 1.0,
                unitPrice = 45.0,
                total = 45.0,
                productId = 3,
                observation = "Sem sal"
            ),
            TableOrderItem(
                id = 2,
                code = "PROD005",
                name = "Sushi de Salmão (8 unidades)",
                quantity = 1.0,
                unitPrice = 32.0,
                total = 32.0,
                productId = 5,
                observation = "ok 2"
            )
        ),
        createdAt = "2026-03-14T14:09:41.256Z"
    )

    MaterialTheme {
        TabSummaryDialog(
            order = mockOrder,
            isClosingTab = false,
            onConfirm = {},
            onDismiss = {}
        )
    }
}