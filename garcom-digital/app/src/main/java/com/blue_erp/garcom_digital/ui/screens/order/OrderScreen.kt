package com.blue_erp.garcom_digital.ui.screens.order

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.blue_erp.garcom_digital.data.model.ProductResponse
import com.blue_erp.garcom_digital.ui.screens.order.components.OrderBottomBar
import com.blue_erp.garcom_digital.ui.screens.order.components.OrderItemCard
import com.blue_erp.garcom_digital.ui.screens.order.components.ProductSearchSheet
import com.blue_erp.garcom_digital.ui.screens.order.components.TabSummaryDialog
import java.text.NumberFormat
import java.util.Locale

val currencyFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

@Composable
fun OrderScreen(
    onBack: () -> Unit,
    viewModel: OrderViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError() // recarrega após fechar o snackbar
        }
    }

    LaunchedEffect(uiState.success) {
        uiState.success?.let { viewModel.clearSuccess(); snackbarHostState.showSnackbar(it) }
    }

    LaunchedEffect(uiState.shouldNavigateBack) {
        if (uiState.shouldNavigateBack) onBack()
    }

    OrderScreenContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onBack = onBack,
        onSave = viewModel::saveChanges,
        onIncrement = viewModel::incrementItem,
        onDecrement = viewModel::decrementItem,
        onRemove = viewModel::removeItem,
        onOpenProductSearch = viewModel::openProductSearch,
        onCloseProductSearch = viewModel::closeProductSearch,
        onProductQueryChange = viewModel::onProductQueryChange,
        onAddProduct = viewModel::addProduct,
        onCloseTab = viewModel::closeTab,
        onOpenCloseTabDialog = viewModel::openCloseTabDialog,
        onCloseCloseTabDialog = viewModel::closeCloseTabDialog,
        onCategorySelect = viewModel::selectCategory,
        onCloseTabSummaryDialog = viewModel::closeTabSummaryDialog,
        onObservationChange = viewModel::updateObservation
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreenContent(
    uiState: OrderUiState,
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    onBack: () -> Unit,
    onSave: () -> Unit,
    onIncrement: (Int) -> Unit,
    onDecrement: (Int) -> Unit,
    onRemove: (Int) -> Unit,
    onOpenProductSearch: () -> Unit,
    onCloseProductSearch: () -> Unit,
    onProductQueryChange: (String) -> Unit,
    onAddProduct: (ProductResponse) -> Unit,
    onCloseTab: () -> Unit,
    onOpenCloseTabDialog: () -> Unit,
    onCloseCloseTabDialog: () -> Unit,
    onCategorySelect: (Int?) -> Unit,
    onCloseTabSummaryDialog: () -> Unit,
    onObservationChange: (Int, String) -> Unit
) {
    val table = uiState.table
    val order = uiState.order
    val total = uiState.editedItems.sumOf { it.total }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Mesa ${table?.number ?: "-"}",
                            style = MaterialTheme.typography.titleMedium
                        )
                        if (order?.customerName != null) {
                            Text(
                                text = order.customerName,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                actions = {
                    if (uiState.hasUnsavedChanges) {
                        IconButton(onClick = onSave, enabled = !uiState.isSaving) {
                            if (uiState.isSaving) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = MaterialTheme.colorScheme.onPrimary,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(Icons.Default.Check, contentDescription = "Salvar")
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onOpenProductSearch,
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar item")
            }
        },
        bottomBar = {
            OrderBottomBar(
                total = total,
                isClosingTab = uiState.isClosingTab,
                onCloseTab = onOpenCloseTabDialog
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator() }
            }

            uiState.editedItems.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.ShoppingCart,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Nenhum item na comanda",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(items = uiState.editedItems, key = { it.id }) { item ->
                        OrderItemCard(
                            item = item,
                            onIncrement = { onIncrement(item.id) },
                            onDecrement = { onDecrement(item.id) },
                            onRemove = { onRemove(item.id) },
                            onObservationChange = { onObservationChange(item.id, it) }
                        )
                    }
                }
            }
        }
    }

    if (uiState.showCloseTabDialog) {
        AlertDialog(
            onDismissRequest = onCloseCloseTabDialog,
            title = { Text("Fechar comanda") },
            text = { Text("Deseja fechar comanda e liberar mesa?") },
            confirmButton = {
                TextButton(onClick = onCloseTab) { Text("Confirmar") }
            },
            dismissButton = {
                TextButton(onClick = onCloseCloseTabDialog) { Text("Cancelar") }
            }
        )
    }

    if (uiState.showProductSearch) {
        ProductSearchSheet(
            query = uiState.productQuery,
            products = uiState.products,
            categories = uiState.categories,
            selectedCategoryId = uiState.selectedCategoryId,
            isLoading = uiState.isSearchingProducts,
            onQueryChange = onProductQueryChange,
            onCategorySelect = onCategorySelect,
            onProductClick = onAddProduct,
            onDismiss = onCloseProductSearch
        )
    }

    if (uiState.showTabSummaryDialog) {
        uiState.tabSummaryOrder?.let { order ->
            TabSummaryDialog(
                order = order,
                isClosingTab = uiState.isClosingTab,
                onConfirm = onCloseTab,
                onDismiss = onCloseTabSummaryDialog
            )
        }
    }
}