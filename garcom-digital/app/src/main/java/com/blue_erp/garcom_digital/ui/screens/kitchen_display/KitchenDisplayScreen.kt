package com.blue_erp.garcom_digital.ui.screens.kitchen_display

import android.annotation.SuppressLint
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.TimeBadgeColor

// --- Cores do Tema Renovado ---
private val KdsBgGradient = Brush.verticalGradient(listOf(Color(0xFF2D0A5A), Color(0xFF1A0535)))
private val KdsCardBg = Color(0xFF3D1065).copy(alpha = 0.6f)
private val KdsAccent = Color(0xFF7C3AED)
private val KdsWarning = Color(0xFFF59E0B)
private val KdsSuccess = Color(0xFF22C55E)
private val KdsInfo = Color(0xFF3B82F6)

@Composable
fun KitchenDisplayScreen(
    onLogout: () -> Unit,
    viewModel: KitchenDisplayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.isLoggedOut) { if (uiState.isLoggedOut) onLogout() }
    LaunchedEffect(uiState.error) { uiState.error?.let { snackbarHostState.showSnackbar(it); viewModel.clearError() } }

    KitchenDisplayContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onStartPreparing = viewModel::startPreparing,
        onMarkAsReady = viewModel::markAsReady,
        onCompleteOrder = viewModel::completeOrder,
        onOpenKitchenConfig = viewModel::openKitchenConfigDialog,
        onCloseKitchenConfig = viewModel::closeKitchenConfigDialog,
        onSaveKitchenConfig = viewModel::saveKitchenConfig,
        onRefresh = viewModel::loadOrders,
        getElapsedMinutes = viewModel::getElapsedMinutes,
        getTimeBadgeColor = viewModel::getTimeBadgeColor,
        onLogout = viewModel::logout,
    )
}

@SuppressLint("UnusedBoxWithConstraintsScope")
@Composable
internal fun KitchenDisplayContent(
    uiState: KitchenDisplayUiState,
    onLogout: () -> Unit,
    snackbarHostState: SnackbarHostState,
    onStartPreparing: (KitchenOrderItem) -> Unit,
    onMarkAsReady: (KitchenOrderItem) -> Unit,
    onCompleteOrder: (KitchenOrderItem) -> Unit,
    onOpenKitchenConfig: () -> Unit,
    onCloseKitchenConfig: () -> Unit,
    onSaveKitchenConfig: (String) -> Unit,
    onRefresh: () -> Unit,
    getElapsedMinutes: (KitchenOrderItem) -> Int,
    getTimeBadgeColor: (Int) -> TimeBadgeColor,
) {
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color(0xFF1A0535)
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().background(KdsBgGradient).padding(paddingValues)) {
            Column(modifier = Modifier.fillMaxSize()) {
                KdsHeader(
                    totalItems = uiState.totalItems,
                    canConfigureKitchen = uiState.canConfigureKitchen,
                    onConfigureKitchen = onOpenKitchenConfig,
                    onRefresh = onRefresh,
                    onLogout = onLogout,
                )

                if (uiState.isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = KdsAccent)
                    }
                } else {
                    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                        val isTabletLayout = maxWidth > 700.dp

                        if (isTabletLayout) {
                            Row(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                KdsColumn(Modifier.weight(1f), "Aguardando", uiState.pendingOrders, KdsWarning, getElapsedMinutes, getTimeBadgeColor, "Iniciar Preparo", KdsInfo, onStartPreparing)
                                KdsColumn(Modifier.weight(1f), "Preparando", uiState.preparingOrders, KdsInfo, getElapsedMinutes, getTimeBadgeColor, "Pronto", KdsSuccess, onMarkAsReady)
                                KdsColumn(Modifier.weight(1f), "Prontos", uiState.readyOrders, KdsSuccess, getElapsedMinutes, getTimeBadgeColor, "Entregar", KdsAccent, onCompleteOrder)
                            }
                        } else {
                            MobileTabsLayout(uiState, getElapsedMinutes, getTimeBadgeColor, onStartPreparing, onMarkAsReady, onCompleteOrder)
                        }
                    }
                }
            }
        }
    }

    if (uiState.showKitchenConfigDialog) {
        KitchenConfigDialog(uiState.kitchenOptions, uiState.defaultKitchen ?: "Todas as cozinhas", onSaveKitchenConfig, onCloseKitchenConfig)
    }
}

@Composable
private fun MobileTabsLayout(
    uiState: KitchenDisplayUiState,
    getElapsedMinutes: (KitchenOrderItem) -> Int,
    getTimeBadgeColor: (Int) -> TimeBadgeColor,
    onStart: (KitchenOrderItem) -> Unit,
    onReady: (KitchenOrderItem) -> Unit,
    onComplete: (KitchenOrderItem) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Aguardando" to uiState.pendingOrders, "Preparando" to uiState.preparingOrders, "Prontos" to uiState.readyOrders)

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color.Transparent,
            contentColor = Color.White,
            divider = {},
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(Modifier.tabIndicatorOffset(tabPositions[selectedTab]), color = KdsAccent)
            }
        ) {
            tabs.forEachIndexed { index, (label, list) ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text("$label (${list.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                )
            }
        }

        val currentTab = tabs[selectedTab]
        KdsColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            title = currentTab.first,
            orders = currentTab.second,
            indicatorColor = when(selectedTab) { 0 -> KdsWarning; 1 -> KdsInfo; else -> KdsSuccess },
            getElapsedMinutes = getElapsedMinutes,
            getTimeBadgeColor = getTimeBadgeColor,
            actionLabel = when(selectedTab) { 0 -> "Iniciar Preparo"; 1 -> "Marcar Pronto"; else -> "Confirmar Entrega" },
            actionColor = when(selectedTab) { 0 -> KdsInfo; 1 -> KdsSuccess; else -> KdsAccent },
            onAction = when(selectedTab) { 0 -> onStart; 1 -> onReady; else -> onComplete }
        )
    }
}

@Composable
private fun KdsHeader(totalItems: Int, canConfigureKitchen: Boolean, onLogout: () -> Unit, onConfigureKitchen: () -> Unit, onRefresh: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("Cozinha", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
            Surface(shape = CircleShape, color = KdsAccent.copy(alpha = 0.2f), border = BorderStroke(1.dp, KdsAccent.copy(alpha = 0.5f))) {
                Text("Total de Itens: $totalItems", color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp))
            }
        }
        Spacer(modifier = Modifier.weight(1f))

        HeaderIcon(Icons.Default.Refresh, onRefresh)
        if (canConfigureKitchen) HeaderIcon(Icons.Default.Settings, onConfigureKitchen)
        HeaderIcon(Icons.AutoMirrored.Filled.Logout, onLogout, isCritical = true)
    }
}

@Composable
private fun HeaderIcon(icon: ImageVector, onClick: () -> Unit, isCritical: Boolean = false) {
    IconButton(
        onClick = onClick,
        modifier = Modifier.padding(start = 8.dp).background(if (isCritical) Color.Red.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.05f), CircleShape)
    ) { Icon(icon, null, tint = if (isCritical) Color(0xFFFFAAAA) else Color.White) }
}

@Composable
private fun KdsColumn(
    modifier: Modifier = Modifier,
    title: String,
    orders: List<KitchenOrderItem>,
    indicatorColor: Color,
    getElapsedMinutes: (KitchenOrderItem) -> Int,
    getTimeBadgeColor: (Int) -> TimeBadgeColor,
    actionLabel: String,
    actionColor: Color,
    onAction: (KitchenOrderItem) -> Unit
) {
    Column(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 16.dp)) {
            Box(modifier = Modifier.size(12.dp).background(indicatorColor, CircleShape))
            Text(title, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 12.dp))
            Spacer(modifier = Modifier.weight(1f))
            Text("${orders.size}", color = indicatorColor, fontWeight = FontWeight.Bold)
        }

        if (orders.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Tudo limpo por aqui!", color = Color.White.copy(alpha = 0.4f))
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(orders, key = { it.id }) { item ->
                    val min = getElapsedMinutes(item)
                    KdsItemCard(item, min, getTimeBadgeColor(min), actionLabel, actionColor) { onAction(item) }
                }
            }
        }
    }
}

@Composable
private fun KdsItemCard(item: KitchenOrderItem, elapsedMinutes: Int, timeBadgeColor: TimeBadgeColor, actionLabel: String, actionColor: Color, onAction: () -> Unit) {
    val timeColor = when (timeBadgeColor) {
        TimeBadgeColor.GREEN -> KdsSuccess; TimeBadgeColor.YELLOW -> KdsWarning; TimeBadgeColor.RED -> Color.Red
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = KdsCardBg,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("#${item.orderNumber}", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(item.name, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Surface(color = KdsAccent.copy(alpha = 0.2f), shape = RoundedCornerShape(4.dp)) {
                        Text(item.table, color = KdsAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                    }
                }

                Surface(shape = CircleShape, color = timeColor.copy(alpha = 0.15f), border = BorderStroke(1.dp, timeColor.copy(alpha = 0.5f))) {
                    Text("${elapsedMinutes}m", color = timeColor, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                }
            }

            if (item.observation != null) {
                Spacer(Modifier.height(8.dp))
                Surface(color = Color.Red.copy(alpha = 0.1f), shape = RoundedCornerShape(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Text("OBS: ${item.observation}", color = Color(0xFFFCA5A5), fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(8.dp))
                }
            }

            Spacer(Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Person, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(14.dp))
                Text(item.customerName, color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp, modifier = Modifier.padding(start = 4.dp))
                Spacer(modifier = Modifier.weight(1f))
                Text("${item.quantity}x", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
            }

            Spacer(Modifier.height(16.dp))

            Button(
                onClick = onAction,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = actionColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(actionLabel, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun KitchenConfigDialog(options: List<String>, current: String, onSave: (String) -> Unit, onDismiss: () -> Unit) {
    var selected by remember { mutableStateOf(current) }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { Button(onClick = { onSave(selected) }) { Text("Salvar Configuração") } },
        title = { Text("Configurar Cozinha Ativa") },
        text = {
            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                OutlinedTextField(
                    value = selected, onValueChange = {}, readOnly = true,
                    label = { Text("Selecione a Cozinha") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                    options.forEach { option ->
                        DropdownMenuItem(text = { Text(option) }, onClick = { selected = option; expanded = false })
                    }
                }
            }
        }
    )
}