package com.blue_erp.garcom_digital.ui.screens.kitchen_display

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.ProductionStatus
import com.blue_erp.garcom_digital.data.model.TimeBadgeColor

@Composable
fun KitchenDisplayScreen(
    onBack: () -> Unit,
    viewModel: KitchenDisplayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { snackbarHostState.showSnackbar(it); viewModel.clearError() }
    }
    LaunchedEffect(uiState.success) {
        uiState.success?.let { snackbarHostState.showSnackbar(it); viewModel.clearSuccess() }
    }

    KitchenDisplayContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onStartPreparing = viewModel::startPreparing,
        onMarkAsReady = viewModel::markAsReady,
        onCompleteOrder = viewModel::completeOrder,
        onOpenCancelConfirm = viewModel::openCancelConfirm,
        onCloseCancelConfirm = viewModel::closeCancelConfirm,
        onConfirmCancel = viewModel::cancelOrder,
        onOpenKitchenConfig = viewModel::openKitchenConfigDialog,
        onCloseKitchenConfig = viewModel::closeKitchenConfigDialog,
        onSaveKitchenConfig = viewModel::saveKitchenConfig,
        onRefresh = viewModel::loadOrders,
        getElapsedMinutes = viewModel::getElapsedMinutes,
        getTimeBadgeColor = viewModel::getTimeBadgeColor,
        onBack = onBack
    )
}

@Composable
private fun KitchenDisplayContent(
    uiState: KitchenDisplayUiState,
    snackbarHostState: SnackbarHostState,
    onStartPreparing: (KitchenOrderItem) -> Unit,
    onMarkAsReady: (KitchenOrderItem) -> Unit,
    onCompleteOrder: (KitchenOrderItem) -> Unit,
    onOpenCancelConfirm: (KitchenOrderItem) -> Unit,
    onCloseCancelConfirm: () -> Unit,
    onConfirmCancel: (KitchenOrderItem) -> Unit,
    onOpenKitchenConfig: () -> Unit,
    onCloseKitchenConfig: () -> Unit,
    onSaveKitchenConfig: (String) -> Unit,
    onRefresh: () -> Unit,
    getElapsedMinutes: (KitchenOrderItem) -> Int,
    getTimeBadgeColor: (Int) -> TimeBadgeColor,
    onBack: () -> Unit
) {
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color(0xFF2D0A5A)
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            KdsHeader(
                totalItems = uiState.totalItems,
                onConfigureKitchen = onOpenKitchenConfig,
                onRefresh = onRefresh,
                onBack = onBack
            )

            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF7C3AED))
                }
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    KdsColumn(
                        modifier = Modifier.weight(1f),
                        title = "Aguardando",
                        count = uiState.pendingOrders.size,
                        indicatorColor = Color(0xFFF59E0B),
                        emptyMessage = "Nenhum item aguardando"
                    ) {
                        uiState.pendingOrders.forEach { item ->
                            val minutes = getElapsedMinutes(item)
                            KdsItemCard(
                                item = item,
                                elapsedMinutes = minutes,
                                timeBadgeColor = getTimeBadgeColor(minutes),
                                actionLabel = "Iniciar Preparo",
                                actionColor = Color(0xFF3B82F6),
                                onAction = { onStartPreparing(item) },
                                onCancel = { onOpenCancelConfirm(item) }
                            )
                        }
                    }

                    KdsColumn(
                        modifier = Modifier.weight(1f),
                        title = "Preparando",
                        count = uiState.preparingOrders.size,
                        indicatorColor = Color(0xFF3B82F6),
                        emptyMessage = "Nenhum item em preparo"
                    ) {
                        uiState.preparingOrders.forEach { item ->
                            val minutes = getElapsedMinutes(item)
                            KdsItemCard(
                                item = item,
                                elapsedMinutes = minutes,
                                timeBadgeColor = getTimeBadgeColor(minutes),
                                actionLabel = "Marcar como Pronto",
                                actionColor = Color(0xFF22C55E),
                                onAction = { onMarkAsReady(item) },
                                onCancel = { onOpenCancelConfirm(item) }
                            )
                        }
                    }

                    KdsColumn(
                        modifier = Modifier.weight(1f),
                        title = "Prontos",
                        count = uiState.readyOrders.size,
                        indicatorColor = Color(0xFF22C55E),
                        emptyMessage = "Nenhum item pronto"
                    ) {
                        uiState.readyOrders.forEach { item ->
                            val minutes = getElapsedMinutes(item)
                            KdsItemCard(
                                item = item,
                                elapsedMinutes = minutes,
                                timeBadgeColor = getTimeBadgeColor(minutes),
                                actionLabel = "Confirmar Entrega",
                                actionColor = Color(0xFF7C3AED),
                                onAction = { onCompleteOrder(item) },
                                onCancel = { onOpenCancelConfirm(item) }
                            )
                        }
                    }
                }
            }
        }
    }

    if (uiState.cancelConfirmItem != null) {
        AlertDialog(
            onDismissRequest = onCloseCancelConfirm,
            title = { Text("Cancelar item") },
            text = { Text("Deseja cancelar o item \"${uiState.cancelConfirmItem.name}\"?") },
            confirmButton = {
                TextButton(onClick = { onConfirmCancel(uiState.cancelConfirmItem) }) {
                    Text("Confirmar", color = Color(0xFFEF4444))
                }
            },
            dismissButton = {
                TextButton(onClick = onCloseCancelConfirm) { Text("Voltar") }
            }
        )
    }

    if (uiState.showKitchenConfigDialog) {
        KitchenConfigDialog(
            options = uiState.kitchenOptions,
            current = uiState.defaultKitchen ?: "Todas as cozinhas",
            onSave = onSaveKitchenConfig,
            onDismiss = onCloseKitchenConfig
        )
    }
}

@Composable
private fun KdsHeader(
    totalItems: Int,
    onConfigureKitchen: () -> Unit,
    onRefresh: () -> Unit,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF4A1572))
            .padding(horizontal = 24.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(Color(0xFFF59E0B), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("C", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            Text("Cozinha", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF3D1065),
            border = BorderStroke(1.dp, Color(0xFF7C3AED))
        ) {
            Text(
                text = "Total de Itens: $totalItems",
                color = Color.White,
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        KdsHeaderButton(label = "Configurar Cozinha", icon = Icons.Default.Settings, onClick = onConfigureKitchen)
        KdsHeaderButton(label = "Atualizar", icon = Icons.Default.Refresh, onClick = onRefresh)
        Button(
            onClick = onBack,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Voltar para menu", color = Color.White, fontSize = 14.sp)
        }
    }
}

@Composable
private fun KdsHeaderButton(label: String, icon: ImageVector, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        border = BorderStroke(1.dp, Color(0xFF7C3AED)),
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, fontSize = 14.sp)
    }
}

@Composable
private fun KdsColumn(
    modifier: Modifier = Modifier,
    title: String,
    count: Int,
    indicatorColor: Color,
    emptyMessage: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .background(Color(0xFF3D1065), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(modifier = Modifier.size(10.dp).background(indicatorColor, CircleShape))
                Text(title, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
            Box(
                modifier = Modifier
                    .background(Color(0xFF4A1572), CircleShape)
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text("$count", color = indicatorColor, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }

        if (count == 0) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(emptyMessage, color = Color(0xFF9CA3AF), fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item { content() }
            }
        }
    }
}

@Composable
private fun KdsItemCard(
    item: KitchenOrderItem,
    elapsedMinutes: Int,
    timeBadgeColor: TimeBadgeColor,
    actionLabel: String,
    actionColor: Color,
    onAction: () -> Unit,
    onCancel: () -> Unit
) {
    val borderColor = when (item.productionStatus) {
        ProductionStatus.PENDING     -> Color(0xFFF59E0B)
        ProductionStatus.IN_PROGRESS -> Color(0xFF3B82F6)
        ProductionStatus.COMPLETED   -> Color(0xFF22C55E)
        ProductionStatus.CANCELED    -> Color(0xFF6B7280)
    }

    val badgeColor = when (timeBadgeColor) {
        TimeBadgeColor.GREEN  -> Color(0xFF22C55E)
        TimeBadgeColor.YELLOW -> Color(0xFFF59E0B)
        TimeBadgeColor.RED    -> Color(0xFFEF4444)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
            .background(Color(0xFF2D0A5A), RoundedCornerShape(8.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Header: pedido + mesa + tempo
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("#${item.orderNumber}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF7C3AED)) {
                    Text(
                        item.table,
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
            Surface(shape = RoundedCornerShape(12.dp), color = Color(0xFF4A1572)) {
                Text(
                    "${elapsedMinutes}min",
                    color = badgeColor,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        // Item
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF3B82F6)) {
                    Text(
                        "${item.quantity}x",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                Column {
                    Text(item.name, color = Color.White, fontSize = 13.sp)
                    Text("Código: ${item.code}", color = Color(0xFF9CA3AF), fontSize = 11.sp)
                    item.observation?.let {
                        Text(it, color = Color(0xFF9CA3AF), fontSize = 11.sp)
                    }
                    item.notes?.let {
                        Text(it, color = Color(0xFF9CA3AF), fontSize = 11.sp)
                    }
                }
            }
            Icon(Icons.Default.Send, contentDescription = null, tint = Color(0xFF7C3AED), modifier = Modifier.size(18.dp))
        }

        // Operador/cliente
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF9CA3AF), modifier = Modifier.size(14.dp))
            Text(item.customerName, color = Color(0xFF9CA3AF), fontSize = 12.sp)
        }

        // Botões
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onAction,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = actionColor),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(actionLabel, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            OutlinedButton(
                onClick = onCancel,
                border = BorderStroke(1.dp, Color(0xFFEF4444)),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444))
            ) {
                Text("Cancelar", fontSize = 13.sp)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun KitchenConfigDialog(
    options: List<String>,
    current: String,
    onSave: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var selected by remember { mutableStateOf(current) }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Configurar Cozinha") },
        text = {
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = selected,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Cozinha padrão") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                    options.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option) },
                            onClick = { selected = option; expanded = false }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(selected) }) { Text("Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}