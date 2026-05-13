package com.blue_erp.garcom_digital.ui.screens.order.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.blue_erp.garcom_digital.data.model.ProductResponse
import com.blue_erp.garcom_digital.ui.screens.order.currencyFormat

enum class ComplementType { SINGLE, MULTI_QTY }

data class CategoryComplements(
    val type: ComplementType,
    val options: List<String>
)

private val categoryComplements = mapOf(
    // Carnes — seleção única
    1 to CategoryComplements(ComplementType.SINGLE, listOf("Mal passada", "Ao ponto", "Bem passada")),
    2 to CategoryComplements(ComplementType.SINGLE, listOf("Mal passada", "Ao ponto", "Bem passada")),
    3 to CategoryComplements(ComplementType.SINGLE, listOf("Mal passada", "Ao ponto", "Bem passada")),
    4 to CategoryComplements(ComplementType.SINGLE, listOf("Mal passada", "Ao ponto", "Bem passada")),
    5 to CategoryComplements(ComplementType.SINGLE, listOf("Mal passada", "Ao ponto", "Bem passada")),
    // Bebidas — checkbox + quantidade
    7  to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    8  to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    9  to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    10 to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    11 to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    12 to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    13 to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    14 to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
    15 to CategoryComplements(ComplementType.MULTI_QTY, listOf("Copo c/ gelo", "Copo s/ gelo", "Copo c/ gelo e limão")),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailSheet(
    product: ProductResponse,
    onConfirm: (observation: String, quantity: Int) -> Unit,
    onDismiss: () -> Unit
) {
    val config = categoryComplements[product.categoryId]
    val options = config?.options ?: emptyList()
    var quantity by remember { mutableIntStateOf(1) }

    var selectedSingle by remember { mutableStateOf<String?>(null) }
    val selectedMulti = remember { mutableStateMapOf<String, Int>() }
    var freeObservation by remember { mutableStateOf("") }

    val observation = buildString {
        when (config?.type) {
            ComplementType.SINGLE -> selectedSingle?.let { append(it) }
            ComplementType.MULTI_QTY -> {
                if (selectedMulti.isNotEmpty()) {
                    append(selectedMulti.entries.joinToString(", ") { (opt, qty) ->
                        "${qty}x $opt"
                    })
                }
            }
            null -> {}
        }
        if (freeObservation.isNotBlank()) {
            if (isNotEmpty()) append(". ")
            append(freeObservation.trim())
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = currencyFormat.format(product.price),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            HorizontalDivider()

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Quantidade",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { if (quantity > 1) quantity-- }) { Text("-") }
                    Text(text = quantity.toString(), style = MaterialTheme.typography.bodyMedium)
                    IconButton(onClick = { quantity++ }) { Text("+") }
                }
            }

            if (options.isNotEmpty()) {
                Text(
                    text = "Complementos",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                when (config?.type) {
                    ComplementType.SINGLE -> {
                        options.forEach { option ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = selectedSingle == option,
                                    onClick = {
                                        selectedSingle = if (selectedSingle == option) null else option
                                    }
                                )
                                Text(text = option, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                    ComplementType.MULTI_QTY -> {
                        options.forEach { option ->
                            val qty = selectedMulti[option] ?: 0
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = qty > 0,
                                    onCheckedChange = { checked ->
                                        if (checked) selectedMulti[option] = 1
                                        else selectedMulti.remove(option)
                                    }
                                )
                                Text(
                                    text = option,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.weight(1f)
                                )
                                if (qty > 0) {
                                    IconButton(onClick = {
                                        if (qty > 1) selectedMulti[option] = qty - 1
                                        else selectedMulti.remove(option)
                                    }) { Text("-") }
                                    Text(
                                        text = qty.toString(),
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    IconButton(onClick = {
                                        selectedMulti[option] = qty + 1
                                    }) { Text("+") }
                                }
                            }
                        }
                    }
                    null -> {}
                }

                HorizontalDivider()
            }

            Text(
                text = "Observação",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            OutlinedTextField(
                value = freeObservation,
                onValueChange = { freeObservation = it },
                placeholder = { Text("Ex: sem cebola, bem passado...") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3
            )

            Spacer(modifier = Modifier.height(4.dp))

            Button(
                onClick = { onConfirm(observation, quantity) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Adicionar à comanda")
            }
        }
    }
}