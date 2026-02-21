package com.blue_erp.garcom_digital.ui.screens.tables

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.blue_erp.garcom_digital.ui.components.TableCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TablesScreen(
    onLogout: () -> Unit,
    onTableClick: (tableId: Int, orderId: Int?) -> Unit,
    viewModel: TablesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) {
            onLogout()
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    LaunchedEffect(uiState.actionSuccess) {
        uiState.actionSuccess?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearActionSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mesas") },
                actions = {
                    IconButton(onClick = viewModel::refreshTables) {
                        Icon(Icons.Default.Refresh, contentDescription = "Atualizar")
                    }
                    IconButton(onClick = viewModel::logout) {
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
        PullToRefreshBox(
            isRefreshing = uiState.isRefreshing,
            onRefresh = viewModel::refreshTables,
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
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

                uiState.tables.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Nenhuma mesa cadastrada",
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
                        items(
                            items = uiState.tables,
                            key = { it.id }
                        ) { table ->
                            TableCard(
                                table = table,
                                onClick = { viewModel.onTableClick(table) },
                                onLongClick = { viewModel.onTableLongClick(table) }
                            )
                        }
                    }
                }
            }
        }
    }

    // Dialog para ocupar mesa
    if (uiState.showOccupyDialog) {
        OccupyTableDialog(
            tableName = "Mesa ${uiState.selectedTable?.number}",
            isLoading = uiState.actionLoading,
            onConfirm = { customer -> viewModel.occupyTable(customer) },
            onDismiss = viewModel::dismissDialogs
        )
    }

    // Dialog para reservar mesa
    if (uiState.showReserveDialog) {
        ReserveTableDialog(
            tableName = "Mesa ${uiState.selectedTable?.number}",
            isLoading = uiState.actionLoading,
            onConfirm = { customer, time -> viewModel.reserveTable(customer, time) },
            onDismiss = viewModel::dismissDialogs
        )
    }

    // Dialog para liberar reserva
    if (uiState.showReleaseConfirmDialog) {
        AlertDialog(
            onDismissRequest = viewModel::dismissDialogs,
            title = { Text("Liberar Reserva") },
            text = {
                Text("Deseja liberar a reserva da Mesa ${uiState.selectedTable?.number}?")
            },
            confirmButton = {
                Button(
                    onClick = viewModel::releaseTable,
                    enabled = !uiState.actionLoading
                ) {
                    if (uiState.actionLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Liberar")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::dismissDialogs) {
                    Text("Cancelar")
                }
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
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Words
                ),
                enabled = !isLoading
            )
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(customer) },
                enabled = customer.isNotBlank() && !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Ocupar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
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
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.Words
                    ),
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
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Reservar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
