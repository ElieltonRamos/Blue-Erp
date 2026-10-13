package com.blue_erp.mobile.ui.screens.oficina.detail_document

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.blue_erp.mobile.data.model.UserResponse
import com.blue_erp.mobile.data.model.oficina.*
import com.blue_erp.mobile.ui.screens.oficina.list_documents.FilterDropdown
import com.blue_erp.mobile.ui.screens.oficina.list_documents.label
import com.blue_erp.mobile.ui.theme.BlueErpTheme
import com.blue_erp.mobile.util.formatCurrency
import com.blue_erp.mobile.util.formatQuantity

private fun DocumentStatus.isEditable() =
    this == DocumentStatus.DRAFT || this == DocumentStatus.APPROVED || this == DocumentStatus.IN_PROGRESS

private fun DocumentType.shortLabel() = when (this) {
    DocumentType.QUOTE -> "Orçamento"
    DocumentType.SERVICE_ORDER -> "OS"
}

private fun DocumentStatus.hint() = when (this) {
    DocumentStatus.DRAFT -> "Orçamento em elaboração. Ao aprovar, ele vira uma ordem de serviço."
    DocumentStatus.APPROVED -> "OS aprovada. Toque em Iniciar OS quando o serviço começar."
    DocumentStatus.IN_PROGRESS -> "OS em andamento. O fechamento e o pagamento são feitos pelo sistema web."
    DocumentStatus.COMPLETED -> "OS concluída. Somente leitura."
    DocumentStatus.CANCELED -> "Documento cancelado. Toque em Reabrir para voltar a editá-lo."
}

private fun DocumentItemResponse.displayName() = productName ?: serviceName ?: "Item"

private fun Double.toInput() =
    if (this % 1.0 == 0.0) toLong().toString() else toString().replace('.', ',')

private class DetailActions(
    val onBack: () -> Unit = {},
    val onRefresh: () -> Unit = {},
    val onApprove: () -> Unit = {},
    val onStart: () -> Unit = {},
    val onReopen: () -> Unit = {},
    val onAskCancel: () -> Unit = {},
    val onConfirmCancel: () -> Unit = {},
    val onDismissCancel: () -> Unit = {},
    val onEditItem: (DocumentItemResponse) -> Unit = {},
    val onCloseEdit: () -> Unit = {},
    val onSaveItem: (DocumentItemResponse, Double, Double, Int?) -> Unit = { _, _, _, _ -> },
    val onAskRemove: (DocumentItemResponse) -> Unit = {},
    val onConfirmRemove: () -> Unit = {},
    val onDismissRemove: () -> Unit = {},
    val onAskResponsible: () -> Unit = {},
    val onSelectResponsible: (UserResponse) -> Unit = {},
    val onDismissResponsible: () -> Unit = {},
    val onOpenAdd: () -> Unit = {},
    val onCloseAdd: () -> Unit = {},
    val onSearchCatalog: (DocumentItemType, String) -> Unit = { _, _ -> },
    val onAddItem: (DocumentItemType, CatalogOption, Double, Double, Int?) -> Unit = { _, _, _, _, _ -> },
)

@Composable
fun DocumentDetailScreen(
    onBack: () -> Unit,
    viewModel: DocumentDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    LaunchedEffect(uiState.message) {
        uiState.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    DocumentDetailContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        actions = DetailActions(
            onBack = onBack,
            onRefresh = viewModel::refresh,
            onApprove = viewModel::approve,
            onStart = viewModel::start,
            onReopen = viewModel::reopen,
            onAskCancel = viewModel::askCancel,
            onConfirmCancel = viewModel::confirmCancel,
            onDismissCancel = viewModel::dismissCancel,
            onEditItem = viewModel::openEdit,
            onCloseEdit = viewModel::closeEdit,
            onSaveItem = viewModel::saveItem,
            onAskRemove = viewModel::askRemove,
            onConfirmRemove = viewModel::confirmRemove,
            onDismissRemove = viewModel::dismissRemove,
            onAskResponsible = viewModel::askResponsible,
            onSelectResponsible = viewModel::selectResponsible,
            onDismissResponsible = viewModel::dismissResponsible,
            onOpenAdd = viewModel::openAddSheet,
            onCloseAdd = viewModel::closeAddSheet,
            onSearchCatalog = viewModel::searchCatalog,
            onAddItem = viewModel::addItem,
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DocumentDetailContent(
    uiState: DocumentDetailUiState,
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    actions: DetailActions
) {
    val colors = MaterialTheme.colorScheme
    val document = uiState.document
    val editable = document?.status?.isEditable() == true
    var menuOpen by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (document == null) "Documento"
                            else "${document.type.shortLabel()} #${document.id}",
                            style = MaterialTheme.typography.titleMedium
                        )
                        document?.let {
                            Text(
                                text = it.clientName,
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.onPrimary.copy(alpha = 0.8f)
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = actions.onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                actions = {
                    IconButton(onClick = actions.onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Atualizar")
                    }
                    if (editable) {
                        Box {
                            IconButton(onClick = { menuOpen = true }) {
                                Icon(Icons.Default.MoreVert, contentDescription = "Mais opções")
                            }
                            DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                                DropdownMenuItem(
                                    text = { Text("Cancelar documento") },
                                    onClick = {
                                        menuOpen = false
                                        actions.onAskCancel()
                                    }
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.primary,
                    titleContentColor = colors.onPrimary,
                    navigationIconContentColor = colors.onPrimary,
                    actionIconContentColor = colors.onPrimary
                )
            )
        },
        bottomBar = {
            if (document != null) {
                DetailBottomBar(document, uiState.isActionLoading, actions)
            }
        },
        floatingActionButton = {
            if (editable) {
                FloatingActionButton(
                    onClick = actions.onOpenAdd,
                    containerColor = colors.secondary,
                    contentColor = colors.onSecondary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Adicionar item")
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        when {
            uiState.isLoading -> Box(
                Modifier.fillMaxSize().padding(paddingValues),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            document == null -> Box(
                Modifier.fillMaxSize().padding(paddingValues).padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Não foi possível carregar o documento", textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = actions.onRefresh) { Text("Tentar novamente") }
                }
            }

            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(paddingValues),
                contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 88.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    HeaderCard(
                        document = document,
                        assetLabel = uiState.assetLabel,
                        editable = editable,
                        onChangeResponsible = actions.onAskResponsible
                    )
                }
                item {
                    Text(
                        text = document.status.hint(),
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.onSurfaceVariant
                    )
                }
                item {
                    Text(
                        text = "Itens (${document.items.size})",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    if (editable && document.items.isNotEmpty()) {
                        Text(
                            text = "Toque em um item para editar quantidade, preço ou mecânico. Use a lixeira para remover.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.onSurfaceVariant
                        )
                    }
                }
                if (document.items.isEmpty()) {
                    item {
                        Text(
                            text = "Nenhum item neste documento.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.onSurfaceVariant
                        )
                    }
                } else {
                    items(items = document.items, key = { it.id }) { item ->
                        ItemCard(
                            item = item,
                            editable = editable,
                            onEdit = { actions.onEditItem(item) },
                            onRemove = { actions.onAskRemove(item) }
                        )
                    }
                }
            }
        }
    }

    if (uiState.showCancelDialog) {
        AlertDialog(
            onDismissRequest = actions.onDismissCancel,
            title = { Text("Cancelar documento") },
            text = { Text("Deseja cancelar este documento? Isso só é possível se ainda não houver venda gerada.") },
            confirmButton = {
                Button(onClick = actions.onConfirmCancel, enabled = !uiState.isActionLoading) {
                    Text("Cancelar documento")
                }
            },
            dismissButton = {
                TextButton(onClick = actions.onDismissCancel) { Text("Voltar") }
            }
        )
    }

    uiState.itemToRemove?.let { item ->
        AlertDialog(
            onDismissRequest = actions.onDismissRemove,
            title = { Text("Remover item") },
            text = { Text("Deseja remover \"${item.displayName()}\" do documento?") },
            confirmButton = {
                Button(onClick = actions.onConfirmRemove, enabled = !uiState.isActionLoading) {
                    Text("Remover")
                }
            },
            dismissButton = {
                TextButton(onClick = actions.onDismissRemove) { Text("Cancelar") }
            }
        )
    }

    if (uiState.showResponsibleDialog) {
        ResponsibleDialog(
            users = uiState.users,
            currentId = document?.responsibleId,
            onSelect = actions.onSelectResponsible,
            onDismiss = actions.onDismissResponsible
        )
    }

    uiState.editingItem?.let { item ->
        EditItemSheet(
            item = item,
            mechanics = uiState.mechanics,
            isSaving = uiState.isActionLoading,
            onDismiss = actions.onCloseEdit,
            onSave = actions.onSaveItem
        )
    }

    if (uiState.showAddSheet) {
        AddItemSheet(
            mechanics = uiState.mechanics,
            results = uiState.catalogResults,
            isSearching = uiState.isSearchingCatalog,
            isSaving = uiState.isActionLoading,
            onSearch = actions.onSearchCatalog,
            onDismiss = actions.onCloseAdd,
            onAdd = actions.onAddItem
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddItemSheet(
    mechanics: List<UserResponse>,
    results: List<CatalogOption>,
    isSearching: Boolean,
    isSaving: Boolean,
    onSearch: (DocumentItemType, String) -> Unit,
    onDismiss: () -> Unit,
    onAdd: (DocumentItemType, CatalogOption, Double, Double, Int?) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var type by remember { mutableStateOf(DocumentItemType.PRODUCT) }
    var term by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<CatalogOption?>(null) }
    var quantityText by remember { mutableStateOf("1") }
    var priceText by remember { mutableStateOf("") }
    var mechanic by remember { mutableStateOf<UserResponse?>(null) }

    val quantity = quantityText.replace(',', '.').toDoubleOrNull()
    val price = priceText.replace(',', '.').toDoubleOrNull()
    val quantityInvalid = quantity == null || quantity <= 0
    val priceInvalid = price == null || price < 0
    val total = if (quantity != null && price != null) quantity * price else null
    val canAdd = selected != null && !quantityInvalid && !priceInvalid && !isSaving

    val mechanicOptions: List<Pair<String, UserResponse?>> =
        listOf<Pair<String, UserResponse?>>("Sem mecânico definido" to null) +
                mechanics.map { it.username to it }

    fun switchType(newType: DocumentItemType) {
        if (newType == type) return
        type = newType
        term = ""
        selected = null
        priceText = ""
        mechanic = null
        onSearch(newType, "")
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Adicionar item",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = type == DocumentItemType.PRODUCT,
                    onClick = { switchType(DocumentItemType.PRODUCT) },
                    label = { Text("Peça") }
                )
                FilterChip(
                    selected = type == DocumentItemType.SERVICE,
                    onClick = { switchType(DocumentItemType.SERVICE) },
                    label = { Text("Serviço") }
                )
            }

            OutlinedTextField(
                value = term,
                onValueChange = {
                    term = it
                    selected = null
                    onSearch(type, it)
                },
                label = { Text(if (type == DocumentItemType.PRODUCT) "Buscar peça" else "Buscar serviço") },
                singleLine = true,
                enabled = !isSaving,
                trailingIcon = {
                    if (isSearching) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            if (results.isNotEmpty() && selected == null) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column {
                        results.forEach { option ->
                            Text(
                                text = "${option.name} — ${formatCurrency(option.price)}",
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selected = option
                                        term = option.name
                                        priceText = option.price.toInput()
                                        onSearch(type, "")
                                    }
                                    .padding(horizontal = 16.dp, vertical = 12.dp)
                            )
                        }
                    }
                }
            }

            Text(
                text = "Digite para buscar e toque no resultado. O preço vem do cadastro e pode ser ajustado.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (type == DocumentItemType.SERVICE && mechanicOptions.size > 1) {
                FilterDropdown(
                    label = "Mecânico (opcional)",
                    selectedText = mechanic?.username ?: "Sem mecânico definido",
                    options = mechanicOptions,
                    onSelect = { mechanic = it },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = quantityText,
                    onValueChange = { quantityText = it },
                    label = { Text("Quantidade") },
                    singleLine = true,
                    isError = quantityInvalid,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    enabled = !isSaving,
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = priceText,
                    onValueChange = { priceText = it },
                    label = { Text("Preço unitário") },
                    singleLine = true,
                    isError = selected != null && priceInvalid,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    enabled = !isSaving,
                    modifier = Modifier.weight(1f)
                )
            }

            Text(
                text = "Total do item: ${total?.let { formatCurrency(it) } ?: "—"}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onDismiss,
                    enabled = !isSaving,
                    modifier = Modifier.weight(1f)
                ) { Text("Cancelar") }

                Button(
                    onClick = {
                        val option = selected
                        if (option != null && quantity != null && price != null) {
                            onAdd(type, option, quantity, price, mechanic?.id)
                        }
                    },
                    enabled = canAdd,
                    modifier = Modifier.weight(1f)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Adicionar")
                    }
                }
            }
        }
    }
}

@Composable
private fun HeaderCard(
    document: DocumentResponse,
    assetLabel: String?,
    editable: Boolean,
    onChangeResponsible: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            InfoRow("Tipo", document.type.label())
            InfoRow("Status", document.status.label())
            InfoRow("Cliente", document.clientName)
            InfoRow(
                "Veículo",
                assetLabel ?: if (document.assetId == null) "Não informado" else "Carregando..."
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                InfoRow(
                    "Responsável",
                    document.responsibleName ?: "Não definido",
                    modifier = Modifier.weight(1f)
                )
                if (editable) {
                    TextButton(onClick = onChangeResponsible) { Text("Alterar") }
                }
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String, modifier: Modifier = Modifier) {
    Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "$label:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun ItemCard(
    item: DocumentItemResponse,
    editable: Boolean,
    onEdit: () -> Unit,
    onRemove: () -> Unit
) {
    val colors = MaterialTheme.colorScheme
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (editable) Modifier.clickable(onClick = onEdit) else Modifier),
        colors = CardDefaults.cardColors(containerColor = colors.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 16.dp, top = 12.dp, bottom = 12.dp, end = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.displayName(),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.onSurface
                )
                Text(
                    text = "${if (item.type == DocumentItemType.PRODUCT) "Produto" else "Serviço"} • " +
                            "${formatQuantity(item.quantity)} x ${formatCurrency(item.unitPrice)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.onSurfaceVariant
                )
                if (item.type == DocumentItemType.SERVICE) {
                    Text(
                        text = "Mecânico: ${item.userName ?: "Não definido"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.onSurfaceVariant
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(item.total),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = colors.onSurface
                )
                if (editable) {
                    IconButton(onClick = onRemove) {
                        Icon(Icons.Default.Delete, contentDescription = "Remover item")
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailBottomBar(
    document: DocumentResponse,
    isActionLoading: Boolean,
    actions: DetailActions
) {
    Surface(tonalElevation = 3.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Total", style = MaterialTheme.typography.bodySmall)
                Text(
                    text = formatCurrency(document.total),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.width(16.dp))
            when (document.status) {
                DocumentStatus.DRAFT -> ActionButton("Aprovar", isActionLoading, actions.onApprove)
                DocumentStatus.APPROVED -> ActionButton("Iniciar OS", isActionLoading, actions.onStart)
                DocumentStatus.CANCELED -> ActionButton("Reabrir", isActionLoading, actions.onReopen)
                DocumentStatus.IN_PROGRESS -> Text(
                    text = "Fechamento pelo sistema web",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
                DocumentStatus.COMPLETED -> Text(
                    text = "OS concluída",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun ActionButton(text: String, loading: Boolean, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = !loading) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary
            )
        } else {
            Text(text)
        }
    }
}

@Composable
private fun ResponsibleDialog(
    users: List<UserResponse>,
    currentId: Int?,
    onSelect: (UserResponse) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Alterar responsável") },
        text = {
            if (users.isEmpty()) {
                Text("Nenhum usuário disponível.")
            } else {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    users.forEach { user ->
                        Text(
                            text = user.username,
                            fontWeight = if (user.id == currentId) FontWeight.Bold else FontWeight.Normal,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(user) }
                                .padding(vertical = 12.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditItemSheet(
    item: DocumentItemResponse,
    mechanics: List<UserResponse>,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (DocumentItemResponse, Double, Double, Int?) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var quantityText by remember(item.id) { mutableStateOf(item.quantity.toInput()) }
    var priceText by remember(item.id) { mutableStateOf(item.unitPrice.toInput()) }
    var mechanic by remember(item.id, mechanics) {
        mutableStateOf(mechanics.firstOrNull { it.id == item.userId })
    }

    val quantity = quantityText.replace(',', '.').toDoubleOrNull()
    val price = priceText.replace(',', '.').toDoubleOrNull()
    val quantityInvalid = quantity == null || quantity <= 0
    val priceInvalid = price == null || price < 0
    val total = if (quantity != null && price != null) quantity * price else null

    // O app só consegue trocar o mecânico, não removê-lo (o JSON não envia null)
    val noneOption: List<Pair<String, UserResponse?>> =
        if (item.userId == null) listOf("Nenhum" to null) else emptyList()
    val mechanicOptions: List<Pair<String, UserResponse?>> =
        noneOption + mechanics.map { it.username to it }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = item.displayName(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            OutlinedTextField(
                value = quantityText,
                onValueChange = { quantityText = it },
                label = { Text("Quantidade") },
                singleLine = true,
                isError = quantityInvalid,
                supportingText = { if (quantityInvalid) Text("Informe uma quantidade maior que zero") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                enabled = !isSaving,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = priceText,
                onValueChange = { priceText = it },
                label = { Text("Preço unitário (R$)") },
                singleLine = true,
                isError = priceInvalid,
                supportingText = { if (priceInvalid) Text("Informe um valor válido") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                enabled = !isSaving,
                modifier = Modifier.fillMaxWidth()
            )

            if (mechanicOptions.isNotEmpty()) {
                FilterDropdown(
                    label = "Mecânico",
                    selectedText = mechanic?.username ?: item.userName ?: "Nenhum",
                    options = mechanicOptions,
                    onSelect = { mechanic = it },
                    modifier = Modifier.fillMaxWidth()
                )
            } else {
                Text(
                    text = "Mecânico: ${item.userName ?: "Não definido"}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Text(
                text = "Total do item: ${total?.let { formatCurrency(it) } ?: "—"}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onDismiss,
                    enabled = !isSaving,
                    modifier = Modifier.weight(1f)
                ) { Text("Cancelar") }

                Button(
                    onClick = {
                        if (quantity != null && price != null) {
                            onSave(item, quantity, price, mechanic?.id)
                        }
                    },
                    enabled = !isSaving && !quantityInvalid && !priceInvalid,
                    modifier = Modifier.weight(1f)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Salvar")
                    }
                }
            }
        }
    }
}

// ── Previews ──────────────────────────────────────────────────────────────────

private val previewDocument = DocumentResponse(
    id = 12, type = DocumentType.SERVICE_ORDER, status = DocumentStatus.IN_PROGRESS,
    clientId = 1, clientName = "João Silva", assetId = 3, responsibleId = 2,
    responsibleName = "carlos", total = 450.0,
    items = listOf(
        DocumentItemResponse(
            id = 1, type = DocumentItemType.SERVICE, productId = null, productName = null,
            serviceId = 4, serviceName = "Troca de óleo", userId = 2, userName = "carlos",
            quantity = 1.0, unitPrice = 150.0, total = 150.0
        ),
        DocumentItemResponse(
            id = 2, type = DocumentItemType.PRODUCT, productId = 8, productName = "Filtro de óleo",
            serviceId = null, serviceName = null, userId = null, userName = null,
            quantity = 2.0, unitPrice = 150.0, total = 300.0
        )
    ),
    approvedAt = null, finishedAt = null, createdAt = "", updatedAt = ""
)

@Preview(showBackground = true, showSystemUi = true, name = "Detalhe da OS")
@Composable
private fun DocumentDetailPreview() {
    BlueErpTheme {
        DocumentDetailContent(
            uiState = DocumentDetailUiState(
                document = previewDocument,
                assetLabel = "ABC-1234",
                isLoading = false
            ),
            actions = DetailActions()
        )
    }
}