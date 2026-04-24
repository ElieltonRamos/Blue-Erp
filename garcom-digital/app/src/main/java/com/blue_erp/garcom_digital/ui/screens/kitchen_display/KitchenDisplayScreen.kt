package com.blue_erp.garcom_digital.ui.screens.kitchen_display

import android.annotation.SuppressLint
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.TableRestaurant
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.blue_erp.garcom_digital.data.model.KitchenOrderItem
import com.blue_erp.garcom_digital.data.model.TimeBadgeColor
import com.blue_erp.garcom_digital.util.isAndroidTv
import kotlinx.coroutines.launch

private val KdsBgGradient = Brush.verticalGradient(listOf(Color(0xFF2D0A5A), Color(0xFF1A0535)))
private val KdsCardBg = Color(0xFF3D1065).copy(alpha = 0.6f)
private val KdsAccent = Color(0xFF7C3AED)
private val KdsWarning = Color(0xFFF59E0B)
private val KdsSuccess = Color(0xFF22C55E)
private val KdsInfo = Color(0xFF3B82F6)

@Composable
fun KitchenDisplayScreen(
    onLogout: () -> Unit,
    onNavigateToTables: () -> Unit,
    viewModel: KitchenDisplayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    val isTV = remember { context.isAndroidTv() }

    LaunchedEffect(uiState.isLoggedOut) { if (uiState.isLoggedOut) onLogout() }
    LaunchedEffect(uiState.error) {
        uiState.error?.let { snackbarHostState.showSnackbar(it); viewModel.clearError() }
    }

    KitchenDisplayContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        isTV = isTV,
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
        onNavigateToTables = onNavigateToTables,
    )
}

@SuppressLint("UnusedBoxWithConstraintsScope")
@Composable
internal fun KitchenDisplayContent(
    uiState: KitchenDisplayUiState,
    onLogout: () -> Unit,
    onNavigateToTables: () -> Unit,
    snackbarHostState: SnackbarHostState,
    isTV: Boolean = false,
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
                    onNavigateToTables = onNavigateToTables,
                    isTV = isTV,
                )

                if (uiState.isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = KdsAccent)
                    }
                } else {
                    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                        if (maxWidth > 700.dp) {
                            ThreeColumnLayout(
                                uiState = uiState,
                                isTV = isTV,
                                getElapsedMinutes = getElapsedMinutes,
                                getTimeBadgeColor = getTimeBadgeColor,
                                onStartPreparing = onStartPreparing,
                                onMarkAsReady = onMarkAsReady,
                                onCompleteOrder = onCompleteOrder,
                            )
                        } else {
                            MobileTabsLayout(
                                uiState = uiState,
                                getElapsedMinutes = getElapsedMinutes,
                                getTimeBadgeColor = getTimeBadgeColor,
                                onStart = onStartPreparing,
                                onReady = onMarkAsReady,
                                onComplete = onCompleteOrder,
                            )
                        }
                    }
                }
            }
        }
    }

    if (uiState.showKitchenConfigDialog) {
        KitchenConfigDialog(
            options = uiState.kitchenOptions,
            current = uiState.defaultKitchen ?: "Todas as cozinhas",
            onSave = onSaveKitchenConfig,
            onDismiss = onCloseKitchenConfig,
            isTV = isTV,
        )
    }
}

// ─── Layout 3 colunas (TV e tablet) ──────────────────────────────────────────

@Composable
private fun ThreeColumnLayout(
    uiState: KitchenDisplayUiState,
    isTV: Boolean,
    getElapsedMinutes: (KitchenOrderItem) -> Int,
    getTimeBadgeColor: (Int) -> TimeBadgeColor,
    onStartPreparing: (KitchenOrderItem) -> Unit,
    onMarkAsReady: (KitchenOrderItem) -> Unit,
    onCompleteOrder: (KitchenOrderItem) -> Unit,
) {
    // Foco no primeiro botão da primeira coluna não-vazia ao entrar na tela
    val firstItemFocusRequester = remember { FocusRequester() }

    if (isTV) {
        LaunchedEffect(Unit) {
            try { firstItemFocusRequester.requestFocus() } catch (_: Exception) {}
        }
    }

    Row(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        KdsColumn(
            modifier = Modifier.weight(1f),
            title = "Aguardando",
            orders = uiState.pendingOrders,
            indicatorColor = KdsWarning,
            getElapsedMinutes = getElapsedMinutes,
            getTimeBadgeColor = getTimeBadgeColor,
            actionLabel = "Iniciar Preparo",
            actionColor = KdsInfo,
            onAction = onStartPreparing,
            isTV = isTV,
            firstItemFocusRequester = firstItemFocusRequester,
        )
        KdsColumn(
            modifier = Modifier.weight(1f),
            title = "Preparando",
            orders = uiState.preparingOrders,
            indicatorColor = KdsInfo,
            getElapsedMinutes = getElapsedMinutes,
            getTimeBadgeColor = getTimeBadgeColor,
            actionLabel = "Marcar Pronto",
            actionColor = KdsSuccess,
            onAction = onMarkAsReady,
            isTV = isTV,
        )
        KdsColumn(
            modifier = Modifier.weight(1f),
            title = "Prontos",
            orders = uiState.readyOrders,
            indicatorColor = KdsSuccess,
            getElapsedMinutes = getElapsedMinutes,
            getTimeBadgeColor = getTimeBadgeColor,
            actionLabel = "Confirmar Entrega",
            actionColor = KdsAccent,
            onAction = onCompleteOrder,
            isTV = isTV,
        )
    }
}

// ─── Layout mobile com tabs ───────────────────────────────────────────────────

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
    val tabs = listOf(
        "Aguardando" to uiState.pendingOrders,
        "Preparando" to uiState.preparingOrders,
        "Prontos"    to uiState.readyOrders
    )

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color.Transparent,
            contentColor = Color.White,
            divider = {},
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                    color = KdsAccent
                )
            }
        ) {
            tabs.forEachIndexed { index, (label, list) ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text("$label (${list.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                )
            }
        }

        val (label, orders) = tabs[selectedTab]
        KdsColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            title = label,
            orders = orders,
            indicatorColor = when (selectedTab) { 0 -> KdsWarning; 1 -> KdsInfo; else -> KdsSuccess },
            getElapsedMinutes = getElapsedMinutes,
            getTimeBadgeColor = getTimeBadgeColor,
            actionLabel = when (selectedTab) { 0 -> "Iniciar Preparo"; 1 -> "Marcar Pronto"; else -> "Confirmar Entrega" },
            actionColor = when (selectedTab) { 0 -> KdsInfo; 1 -> KdsSuccess; else -> KdsAccent },
            onAction = when (selectedTab) { 0 -> onStart; 1 -> onReady; else -> onComplete }
        )
    }
}

// ─── Header ───────────────────────────────────────────────────────────────────

@Composable
private fun KdsHeader(
    totalItems: Int,
    canConfigureKitchen: Boolean,
    onLogout: () -> Unit,
    onConfigureKitchen: () -> Unit,
    onRefresh: () -> Unit,
    onNavigateToTables: () -> Unit,
    isTV: Boolean = false,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("Cozinha", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
            Surface(
                shape = CircleShape,
                color = KdsAccent.copy(alpha = 0.2f),
                border = BorderStroke(1.dp, KdsAccent.copy(alpha = 0.5f))
            ) {
                Text(
                    "Total de Itens: $totalItems",
                    color = Color.White,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            HeaderIcon(Icons.Default.Refresh, onRefresh, isTV = isTV)
            if (canConfigureKitchen) {
                HeaderIcon(Icons.Default.Settings, onConfigureKitchen, isTV = isTV)
                HeaderIcon(Icons.Default.TableRestaurant, onNavigateToTables, isTV = isTV)
            }
            Spacer(modifier = Modifier.width(4.dp))
            HeaderIcon(Icons.AutoMirrored.Filled.Logout, onLogout, isCritical = true, isTV = isTV)
        }
    }
}

@Composable
private fun HeaderIcon(
    icon: ImageVector,
    onClick: () -> Unit,
    isCritical: Boolean = false,
    isTV: Boolean = false,
) {
    var isFocused by remember { mutableStateOf(false) }

    val bgColor = when {
        isTV && isFocused && isCritical -> Color.Red.copy(alpha = 0.4f)
        isTV && isFocused               -> Color.White.copy(alpha = 0.2f)
        isCritical                      -> Color.Red.copy(alpha = 0.1f)
        else                            -> Color.White.copy(alpha = 0.05f)
    }

    IconButton(
        onClick = onClick,
        modifier = Modifier
            .background(bgColor, CircleShape)
            .then(
                if (isTV && isFocused) Modifier.border(
                    width = 2.dp,
                    color = if (isCritical) Color.Red else Color.White,
                    shape = CircleShape
                ) else Modifier
            )
            .onFocusChanged { isFocused = it.isFocused }
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = if (isCritical) Color(0xFFFFAAAA) else Color.White
        )
    }
}

// ─── Coluna de cards ──────────────────────────────────────────────────────────

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
    onAction: (KitchenOrderItem) -> Unit,
    isTV: Boolean = false,
    firstItemFocusRequester: FocusRequester? = null,
) {
    Column(modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Box(modifier = Modifier.size(12.dp).background(indicatorColor, CircleShape))
            Text(
                title,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 12.dp)
            )
            Spacer(modifier = Modifier.weight(1f))
            Text("${orders.size}", color = indicatorColor, fontWeight = FontWeight.Bold)
        }

        if (orders.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Tudo limpo por aqui!", color = Color.White.copy(alpha = 0.4f))
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(orders, key = { it.productionId }) { item ->
                    val min = getElapsedMinutes(item)
                    KdsItemCard(
                        item = item,
                        elapsedMinutes = min,
                        timeBadgeColor = getTimeBadgeColor(min),
                        actionLabel = actionLabel,
                        actionColor = actionColor,
                        onAction = { onAction(item) },
                        isTV = isTV,
                        // FocusRequester só no primeiro item da coluna
                        buttonFocusRequester = if (isTV && item == orders.first()) firstItemFocusRequester else null,
                    )
                }
            }
        }
    }
}

// ─── Card de item ─────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun KdsItemCard(
    item: KitchenOrderItem,
    elapsedMinutes: Int,
    timeBadgeColor: TimeBadgeColor,
    actionLabel: String,
    actionColor: Color,
    onAction: () -> Unit,
    isTV: Boolean = false,
    buttonFocusRequester: FocusRequester? = null,
) {
    val timeColor = when (timeBadgeColor) {
        TimeBadgeColor.GREEN  -> KdsSuccess
        TimeBadgeColor.YELLOW -> KdsWarning
        TimeBadgeColor.RED    -> Color.Red
    }

    // Ao receber foco em qualquer filho, o card sobe para a área visível da LazyColumn
    var cardFocused by remember { mutableStateOf(false) }
    val bringIntoViewRequester = remember { BringIntoViewRequester() }
    val coroutineScope = rememberCoroutineScope()

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = KdsCardBg,
        border = BorderStroke(
            width = if (isTV && cardFocused) 2.dp else 1.dp,
            color = if (isTV && cardFocused) KdsAccent else Color.White.copy(alpha = 0.1f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .bringIntoViewRequester(bringIntoViewRequester)
            .onFocusChanged { state ->
                cardFocused = state.hasFocus
                if (state.hasFocus) {
                    coroutineScope.launch { bringIntoViewRequester.bringIntoView() }
                }
            }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "#${item.orderNumber}",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(item.name, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Surface(color = KdsAccent.copy(alpha = 0.2f), shape = RoundedCornerShape(4.dp)) {
                        Text(
                            item.table,
                            color = KdsAccent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
                Surface(
                    shape = CircleShape,
                    color = timeColor.copy(alpha = 0.15f),
                    border = BorderStroke(1.dp, timeColor.copy(alpha = 0.5f))
                ) {
                    Text(
                        "${elapsedMinutes}m",
                        color = timeColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            item.observation?.let { obs ->
                Spacer(Modifier.height(8.dp))
                Surface(
                    color = Color.Red.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "OBS: $obs",
                        color = Color(0xFFFCA5A5),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Person,
                    null,
                    tint = Color.White.copy(alpha = 0.5f),
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    item.customerName,
                    color = Color.White.copy(alpha = 0.5f),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(start = 4.dp)
                )
                Spacer(modifier = Modifier.weight(1f))
                Text("${item.quantity}x", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
            }

            Spacer(Modifier.height(16.dp))

            Button(
                onClick = onAction,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .then(
                        if (buttonFocusRequester != null) Modifier.focusRequester(buttonFocusRequester)
                        else Modifier
                    ),
                colors = ButtonDefaults.buttonColors(containerColor = actionColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(actionLabel, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            }
        }
    }
}

// ─── Dialog de configuração de cozinha ───────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun KitchenConfigDialog(
    options: List<String>,
    current: String,
    onSave: (String) -> Unit,
    onDismiss: () -> Unit,
    isTV: Boolean = false,
) {
    var selected by remember { mutableStateOf(current) }
    var expanded by remember { mutableStateOf(false) }

    // TV: foca na primeira opção da lista ao abrir o dialog
    val firstOptionFocusRequester = remember { FocusRequester() }
    if (isTV) {
        LaunchedEffect(Unit) {
            try { firstOptionFocusRequester.requestFocus() } catch (_: Exception) {}
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(onClick = { onSave(selected) }) {
                Text("Salvar Configuração")
            }
        },
        title = { Text("Configurar Cozinha Ativa") },
        text = {
            if (isTV) {
                // Dropdown não funciona bem com D-pad — substituído por lista de RadioButtons
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    options.forEachIndexed { index, option ->
                        var rowFocused by remember { mutableStateOf(false) }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    if (rowFocused) KdsAccent.copy(alpha = 0.2f) else Color.Transparent,
                                    RoundedCornerShape(8.dp)
                                )
                                .onFocusChanged { rowFocused = it.hasFocus }
                                .padding(vertical = 4.dp, horizontal = 8.dp)
                        ) {
                            RadioButton(
                                selected = selected == option,
                                onClick = { selected = option },
                                modifier = if (index == 0) Modifier.focusRequester(firstOptionFocusRequester) else Modifier,
                                colors = RadioButtonDefaults.colors(selectedColor = KdsAccent)
                            )
                            Text(option, modifier = Modifier.padding(start = 8.dp))
                        }
                    }
                }
            } else {
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        value = selected,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Selecione a Cozinha") },
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
            }
        }
    )
}