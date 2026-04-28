package com.blue_erp.garcom_digital.ui.screens.tables

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Kitchen
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import com.blue_erp.garcom_digital.data.model.ProductionLocationResponse
import com.blue_erp.garcom_digital.data.model.TableLocation
import com.blue_erp.garcom_digital.data.model.TableResponse
import com.blue_erp.garcom_digital.data.model.TableStatus
import com.blue_erp.garcom_digital.ui.components.TableCard
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme

private fun showTableNotification(context: Context, tableNumber: Int, message: String) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            "table_alerts",
            "Alertas de Mesa",
            NotificationManager.IMPORTANCE_HIGH
        )
        manager.createNotificationChannel(channel)
    }

    val notification = NotificationCompat.Builder(context, "table_alerts")
        .setSmallIcon(android.R.drawable.ic_dialog_alert)
        .setContentTitle("Mesa $tableNumber")
        .setContentText(message)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .build()

    manager.notify(tableNumber, notification)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TablesScreen(
    onLogout: () -> Unit,
    onTableClick: (tableId: Int, orderId: Int?) -> Unit,
    onNavigateToKitchen: () -> Unit,
    viewModel: TablesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* sem ação — notificações futuras checarão o estado atual */ }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.POST_NOTIFICATIONS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (!granted) notificationPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        if (!uiState.isLoading) viewModel.loadTables()
    }

    LaunchedEffect(uiState.pendingNotification) {
        uiState.pendingNotification?.let { notif ->
            val canNotify = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                    ContextCompat.checkSelfPermission(
                        context, android.Manifest.permission.POST_NOTIFICATIONS
                    ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (canNotify) showTableNotification(context, notif.tableNumber, notif.message)
            viewModel.clearNotification()
        }
    }

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) onLogout()
    }

    LaunchedEffect(uiState.navigateToTable) {
        uiState.navigateToTable?.let { tableId ->
            onTableClick(tableId, null)
            viewModel.clearNavigateToTable()
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    LaunchedEffect(uiState.actionSuccess) {
        uiState.actionSuccess?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearActionSuccess()
        }
    }

    TablesScreenContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onRefresh = viewModel::refreshTables,
        onLogout = viewModel::logout,
        onSelectLocation = viewModel::selectLocation,
        onTableClick = viewModel::onTableClick,
        onTableLongClick = viewModel::onTableLongClick,
        onOccupyConfirm = viewModel::occupyTable,
        onReserveConfirm = viewModel::reserveTable,
        onReleaseConfirm = viewModel::releaseTable,
        onNavigateToKitchen = onNavigateToKitchen,
        onDismissDialogs = viewModel::dismissDialogs,
        onFilterTables = viewModel::filterTables,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TablesScreenContent(
    uiState: TablesUiState,
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onSelectLocation: (Int) -> Unit,
    onTableClick: (TableResponse) -> Unit,
    onTableLongClick: (TableResponse) -> Unit,
    onOccupyConfirm: (customer: String) -> Unit,
    onReserveConfirm: (customer: String, time: String) -> Unit,
    onReleaseConfirm: () -> Unit,
    onNavigateToKitchen: () -> Unit,
    onDismissDialogs: () -> Unit,
    onFilterTables: (String) -> Unit,
) {
    val filteredTables = remember(uiState.tables, uiState.tableFilter) {
        if (uiState.tableFilter.isBlank()) uiState.tables
        else uiState.tables.filter { it.number.toString().contains(uiState.tableFilter) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mesas") },
                actions = {
                    if (uiState.isAdmin) {
                        IconButton(onClick = onNavigateToKitchen) {
                            Icon(Icons.Default.Kitchen, contentDescription = "Cozinha")
                        }
                    }
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Atualizar")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Sair")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (uiState.locations.size > 1) {
                val selectedIndex = uiState.locations.indexOfFirst {
                    it.id == uiState.selectedLocationId
                }.coerceAtLeast(0)

                ScrollableTabRow(
                    selectedTabIndex = selectedIndex,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = MaterialTheme.colorScheme.onBackground,
                    edgePadding = 16.dp,
                    indicator = {},
                    divider = {}
                ) {
                    uiState.locations.forEach { location ->
                        val isSelected = location.id == uiState.selectedLocationId
                        Tab(
                            selected = isSelected,
                            onClick = { onSelectLocation(location.id) },
                            modifier = Modifier
                                .padding(horizontal = 4.dp, vertical = 8.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(
                                    if (isSelected) MaterialTheme.colorScheme.secondary
                                    else MaterialTheme.colorScheme.surface
                                ),
                            text = {
                                Text(
                                    text = location.name.uppercase(),
                                    color = if (isSelected) MaterialTheme.colorScheme.onSecondary
                                    else Color.White,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = uiState.tableFilter,
                onValueChange = onFilterTables,
                label = { Text("Filtrar por número") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )

            PullToRefreshBox(
                isRefreshing = uiState.isRefreshing,
                onRefresh = onRefresh,
                modifier = Modifier.fillMaxSize()
            ) {
                when {
                    uiState.isLoading -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }

                    filteredTables.isEmpty() -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (uiState.tableFilter.isBlank()) "Nenhuma mesa cadastrada"
                                else "Nenhuma mesa encontrada",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(items = filteredTables, key = { it.id }) { table ->
                                TableCard(
                                    table = table,
                                    onClick = { onTableClick(table) },
                                    onLongClick = { onTableLongClick(table) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (uiState.showOccupyDialog) {
        OccupyTableDialog(
            tableName = "Mesa ${uiState.selectedTable?.number}",
            isLoading = uiState.actionLoading,
            onConfirm = onOccupyConfirm,
            onDismiss = onDismissDialogs
        )
    }

    if (uiState.showReserveDialog) {
        ReserveTableDialog(
            tableName = "Mesa ${uiState.selectedTable?.number}",
            isLoading = uiState.actionLoading,
            onConfirm = onReserveConfirm,
            onDismiss = onDismissDialogs
        )
    }

    if (uiState.showReleaseConfirmDialog) {
        AlertDialog(
            onDismissRequest = onDismissDialogs,
            title = { Text("Liberar Reserva") },
            text = { Text("Deseja liberar a reserva da Mesa ${uiState.selectedTable?.number}?") },
            confirmButton = {
                Button(
                    onClick = onReleaseConfirm,
                    enabled = !uiState.actionLoading
                ) {
                    if (uiState.actionLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Liberar")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = onDismissDialogs) { Text("Cancelar") }
            }
        )
    }
}

@Composable
private fun OccupyTableDialog(
    tableName: String,
    isLoading: Boolean,
    onConfirm: (customer: String) -> Unit,
    onDismiss: () -> Unit
) {
    var customer by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Ocupar $tableName") },
        text = {
            OutlinedTextField(
                value = customer,
                onValueChange = { customer = it },
                label = { Text("Nome do cliente") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                enabled = !isLoading
            )
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(customer) },
                enabled = customer.isNotBlank() && !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                } else {
                    Text("Ocupar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
private fun ReserveTableDialog(
    tableName: String,
    isLoading: Boolean,
    onConfirm: (customer: String, time: String) -> Unit,
    onDismiss: () -> Unit
) {
    var customer by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Reservar $tableName") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = customer,
                    onValueChange = { customer = it },
                    label = { Text("Nome do cliente") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                    enabled = !isLoading
                )
                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Horário (ex: 20:00)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(customer, time) },
                enabled = customer.isNotBlank() && time.isNotBlank() && !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                } else {
                    Text("Reservar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

// ── Previews ──────────────────────────────────────────────────────────────────

private val previewLocations = listOf(
    ProductionLocationResponse(id = 1, code = "LOCAL_01", name = "Salão",    description = null, active = true, order = 0),
    ProductionLocationResponse(id = 2, code = "LOCAL_02", name = "Varanda",  description = null, active = true, order = 1),
    ProductionLocationResponse(id = 3, code = "LOCAL_03", name = "Área VIP", description = null, active = true, order = 2),
)

private val previewTables = listOf(
    TableResponse(id = 1, number = 1, capacity = 4, status = TableStatus.AVAILABLE, customer = null,    time = null,    locationId = 1, orderId = null, location = TableLocation(1, "code", "a"), order = null, createdAt = "asd", updatedAt = "kkk"),
    TableResponse(id = 2, number = 2, capacity = 2, status = TableStatus.OCCUPIED,  customer = "João",  time = null,    locationId = 1, orderId = 10,   location = TableLocation(1, "code", "a"), order = null, createdAt = "asd", updatedAt = "kkk"),
    TableResponse(id = 3, number = 3, capacity = 6, status = TableStatus.RESERVED,  customer = "Maria", time = "20:00", locationId = 1, orderId = null, location = TableLocation(1, "code", "a"), order = null, createdAt = "asd", updatedAt = "kkk"),
    TableResponse(id = 4, number = 4, capacity = 4, status = TableStatus.AVAILABLE, customer = null,    time = null,    locationId = 1, orderId = null, location = TableLocation(1, "code", "a"), order = null, createdAt = "asd", updatedAt = "kkk"),
)

@Preview(showBackground = true, showSystemUi = true, name = "Mesas – com locais")
@Composable
private fun TablesScreenPreview() {
    GarcomDigitalTheme {
        TablesScreenContent(
            uiState = TablesUiState(
                locations = previewLocations,
                selectedLocationId = 1,
                tables = previewTables
            ),
            onRefresh = {},
            onLogout = {},
            onSelectLocation = {},
            onTableClick = {},
            onTableLongClick = {},
            onOccupyConfirm = {},
            onReserveConfirm = { _, _ -> },
            onReleaseConfirm = {},
            onNavigateToKitchen = {},
            onDismissDialogs = {},
            onFilterTables = {},
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Mesas – carregando")
@Composable
private fun TablesScreenLoadingPreview() {
    GarcomDigitalTheme {
        TablesScreenContent(
            uiState = TablesUiState(isLoading = true),
            onRefresh = {},
            onLogout = {},
            onSelectLocation = {},
            onTableClick = {},
            onTableLongClick = {},
            onOccupyConfirm = {},
            onReserveConfirm = { _, _ -> },
            onReleaseConfirm = {},
            onNavigateToKitchen = {},
            onDismissDialogs = {},
            onFilterTables = {},
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Mesas – lista vazia")
@Composable
private fun TablesScreenEmptyPreview() {
    GarcomDigitalTheme {
        TablesScreenContent(
            uiState = TablesUiState(
                locations = previewLocations,
                selectedLocationId = 2,
                tables = emptyList()
            ),
            onRefresh = {},
            onLogout = {},
            onSelectLocation = {},
            onTableClick = {},
            onTableLongClick = {},
            onOccupyConfirm = {},
            onReserveConfirm = { _, _ -> },
            onReleaseConfirm = {},
            onNavigateToKitchen = {},
            onDismissDialogs = {},
            onFilterTables = {},
        )
    }
}