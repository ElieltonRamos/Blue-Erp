package com.blue_erp.garcom_digital.ui.screens.order

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.blue_erp.garcom_digital.data.model.CategoryResponse
import com.blue_erp.garcom_digital.data.model.ProductResponse
import com.blue_erp.garcom_digital.data.model.TableOrder
import com.blue_erp.garcom_digital.data.model.TableOrderItem
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme
import java.text.NumberFormat
import java.util.Locale

private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

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
            viewModel.loadTable() // recarrega após fechar o snackbar
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
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OrderScreenContent(
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
                            onRemove = { onRemove(item.id) }
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
}

@Composable
private fun OrderItemCard(
    item: TableOrderItem,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = currencyFormat.format(item.unitPrice),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                IconButton(onClick = onDecrement, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Remove, contentDescription = "Diminuir", tint = MaterialTheme.colorScheme.primary)
                }
                Text(
                    text = if (item.quantity % 1.0 == 0.0) item.quantity.toInt().toString()
                    else String.format("%.2f", item.quantity),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.widthIn(min = 28.dp),
                    textAlign = TextAlign.Center
                )
                IconButton(onClick = onIncrement, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Add, contentDescription = "Aumentar", tint = MaterialTheme.colorScheme.primary)
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = currencyFormat.format(item.total),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.widthIn(min = 64.dp),
                textAlign = TextAlign.End
            )

            IconButton(onClick = onRemove, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Delete, contentDescription = "Remover", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun OrderBottomBar(
    total: Double,
    isClosingTab: Boolean,
    onCloseTab: () -> Unit
) {
    Surface(tonalElevation = 4.dp, color = MaterialTheme.colorScheme.surface) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Total", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    text = currencyFormat.format(total),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Button(
                onClick = onCloseTab,
                enabled = !isClosingTab,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                if (isClosingTab) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onError)
                } else {
                    Text("Fechar Comanda")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductSearchSheet(
    query: String,
    products: List<ProductResponse>,
    categories: List<CategoryResponse>,
    selectedCategoryId: Int?,
    isLoading: Boolean,
    onQueryChange: (String) -> Unit,
    onCategorySelect: (Int?) -> Unit,
    onProductClick: (ProductResponse) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 32.dp)
        ) {
            Text(
                text = "Adicionar Item",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = { Text("Buscar produto...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (categories.isNotEmpty()) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(bottom = 8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = selectedCategoryId == null,
                            onClick = { onCategorySelect(null) },
                            label = { Text("Todos") }
                        )
                    }
                    items(categories) { category ->
                        FilterChip(
                            selected = selectedCategoryId == category.id,
                            onClick = { onCategorySelect(if (selectedCategoryId == category.id) null else category.id) },
                            label = { Text(category.name) }
                        )
                    }
                }
            }

            when {
                isLoading -> Box(
                    modifier = Modifier.fillMaxWidth().height(120.dp),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator() }

                products.isEmpty() -> Box(
                    modifier = Modifier.fillMaxWidth().height(120.dp),
                    contentAlignment = Alignment.Center
                ) { Text("Nenhum produto encontrado", color = MaterialTheme.colorScheme.onSurfaceVariant) }

                else -> LazyColumn(
                    modifier = Modifier.fillMaxWidth().heightIn(max = 400.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(products) { product ->
                        Surface(
                            onClick = { onProductClick(product) },
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(product.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Text("Código: ${product.code} ", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        product.quantity?.let {
                                            Text(
                                                text = "Estoque: ${if (it % 1.0 == 0.0) it.toInt().toString() else String.format("%.2f", it)} ${product.unit}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = if (it <= 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                                Text(
                                    text = currencyFormat.format(product.price),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Previews ──────────────────────────────────────────────────────────────────

private val previewItems = listOf(
    TableOrderItem(id = 1, code = "PROD-001", name = "Filé Mignon",       quantity = 2.0, unitPrice = 45.0, total = 90.0,  productId = 1, productionLocation = "asd"),
    TableOrderItem(id = 2, code = "PROD-002", name = "Refrigerante Lata", quantity = 3.0, unitPrice = 8.0,  total = 24.0,  productId = 2, productionLocation = "asd"),
    TableOrderItem(id = 3, code = "PROD-003", name = "Batata Frita",      quantity = 1.0, unitPrice = 22.0, total = 22.0,  productId = 3, productionLocation = "asd"),
)

private val previewOrder = TableOrder(
    id = 2, type = "DINE_IN", locationId = "CHURRASCARIA",
    customerName = "teste", status = "OPEN", total = 136.0,
    items = previewItems, createdAt = "2026-02-23T18:14:05.989Z"
)

@Preview(showBackground = true, showSystemUi = true, name = "Comanda – com itens")
@Composable
private fun OrderScreenPreview() {
    GarcomDigitalTheme {
        OrderScreenContent(
            uiState = OrderUiState(order = previewOrder, editedItems = previewItems),
            onBack = {}, onSave = {},
            onIncrement = {}, onDecrement = {}, onRemove = {},
            onOpenProductSearch = {}, onCloseProductSearch = {},
            onProductQueryChange = {}, onAddProduct = {}, onCategorySelect = {},
            onCloseTab = {}, onCloseCloseTabDialog = {}, onOpenCloseTabDialog = {}
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Comanda – vazia")
@Composable
private fun OrderScreenEmptyPreview() {
    GarcomDigitalTheme {
        OrderScreenContent(
            uiState = OrderUiState(order = previewOrder, editedItems = emptyList()),
            onBack = {}, onSave = {},
            onIncrement = {}, onDecrement = {}, onRemove = {},
            onOpenProductSearch = {}, onCloseProductSearch = {},
            onProductQueryChange = {}, onAddProduct = {}, onOpenCloseTabDialog = {},
            onCloseCloseTabDialog = {}, onCloseTab = {}, onCategorySelect = {},
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Comanda – carregando")
@Composable
private fun OrderScreenLoadingPreview() {
    GarcomDigitalTheme {
        OrderScreenContent(
            uiState = OrderUiState(isLoading = true),
            onBack = {}, onSave = {},
            onIncrement = {}, onDecrement = {}, onRemove = {},
            onOpenProductSearch = {}, onCloseProductSearch = {},
            onProductQueryChange = {}, onAddProduct = {}, onCloseTab = {}, onCloseCloseTabDialog = {},
            onOpenCloseTabDialog = {}, onCategorySelect = {},
        )
    }
}