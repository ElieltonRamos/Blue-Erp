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
import com.blue_erp.garcom_digital.ui.screens.order.components.ProductDetailSheet
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext
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
    val context = LocalContext.current

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    LaunchedEffect(uiState.success) {
        uiState.success?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.clearSuccess()
        }
    }

    LaunchedEffect(uiState.shouldNavigateBack) {
        if (uiState.shouldNavigateBack) onBack()
    }

    OrderScreenContent(
        uiState = uiState,
        onBack = onBack,
        onSave = viewModel::saveChanges,
        onIncrement = viewModel::incrementItem,
        onDecrement = viewModel::decrementItem,
        onRemove = viewModel::removeItem,
        onOpenProductSearch = viewModel::openProductSearch,
        onCloseProductSearch = viewModel::closeProductSearch,
        onProductQueryChange = viewModel::onProductQueryChange,
        onCloseTab = viewModel::closeTab,
        onCategorySelect = viewModel::selectCategory,
        onCloseTabSummaryDialog = viewModel::closeTabSummaryDialog,
        onToggleServiceCharge = viewModel::toggleServiceCharge,
        onServiceChargeAmountChange = viewModel::onServiceChargeAmountChange,
        onOpenProductDetail = viewModel::openProductDetail,
        onCloseProductDetail = viewModel::closeProductDetail,
        onAddProduct = viewModel::addProduct,
        onOpenTabSummary = viewModel::openCloseTabDialog,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreenContent(
    uiState: OrderUiState,
    onBack: () -> Unit,
    onSave: () -> Unit,
    onIncrement: (Int) -> Unit,
    onDecrement: (Int) -> Unit,
    onRemove: (Int) -> Unit,
    onOpenProductSearch: () -> Unit,
    onCloseProductSearch: () -> Unit,
    onProductQueryChange: (String) -> Unit,
    onAddProduct: (ProductResponse, String, Int) -> Unit,
    onOpenProductDetail: (ProductResponse) -> Unit,
    onCloseProductDetail: () -> Unit,
    onOpenTabSummary: () -> Unit,
    onCloseTab: (serviceCharge: Double) -> Unit,
    onCategorySelect: (Int?) -> Unit,
    onCloseTabSummaryDialog: () -> Unit,
    onToggleServiceCharge: () -> Unit,
    onServiceChargeAmountChange: (Double) -> Unit,
) {
    val table = uiState.table
    val order = uiState.order
    val total = uiState.editedItems.sumOf { it.total }
    val grandTotal = total + if (uiState.serviceChargeEnabled) uiState.serviceChargeAmount else 0.0

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
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
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
                total = grandTotal,
                hasUnsavedChanges = uiState.hasUnsavedChanges,
                isSaving = uiState.isSaving,
                isClosingTab = uiState.isClosingTab,
                onSave = onSave,
                onCloseTab = onOpenTabSummary
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
                        )
                    }
                }
            }
        }
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
            onDismiss = onCloseProductSearch,
            onOpenProductDetail = onOpenProductDetail,
        )
    }

    if (uiState.showProductDetailSheet) {
        uiState.selectedProduct?.let { product ->
            ProductDetailSheet(
                product = product,
                onConfirm = { observation, quantity -> onAddProduct(product, observation, quantity) },
                onDismiss = onCloseProductDetail
            )
        }
    }

    if (uiState.showTabSummaryDialog) {
        uiState.tabSummaryOrder?.let { tabOrder ->
            TabSummaryDialog(
                order = tabOrder,
                isClosingTab = uiState.isClosingTab,
                onConfirm = onCloseTab,
                onDismiss = onCloseTabSummaryDialog,
                serviceChargeEnabled = uiState.serviceChargeEnabled,
                serviceChargeAmount = uiState.serviceChargeAmount,
                onToggleServiceCharge = onToggleServiceCharge,
                onServiceChargeAmountChange = onServiceChargeAmountChange,
            )
        }
    }
}