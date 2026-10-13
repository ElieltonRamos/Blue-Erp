package com.blue_erp.mobile.ui.screens.oficina.list_documents

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import com.blue_erp.mobile.data.model.oficina.AssetResponse
import com.blue_erp.mobile.data.model.oficina.ClientResponse
import com.blue_erp.mobile.data.model.oficina.DocumentResponse
import com.blue_erp.mobile.data.model.oficina.DocumentStatus
import com.blue_erp.mobile.data.model.oficina.DocumentType
import com.blue_erp.mobile.ui.theme.BlueErpTheme
import com.blue_erp.mobile.util.formatCurrency
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

private val displayDateFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

@Composable
fun DocumentListScreen(
    onLogout: () -> Unit,
    onDocumentClick: (documentId: Int) -> Unit,
    onCreateClick: () -> Unit,
    viewModel: DocumentListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        if (!uiState.isLoading) viewModel.reload()
    }

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) onLogout()
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    DocumentListContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onRefresh = viewModel::refresh,
        onLogout = viewModel::logout,
        onLoadMore = viewModel::loadMore,
        onStatusSelect = viewModel::setStatus,
        onTypeSelect = viewModel::setType,
        onStartDateSelect = viewModel::setStartDate,
        onEndDateSelect = viewModel::setEndDate,
        onToday = { viewModel.setLastDays(1) },
        onLast7Days = { viewModel.setLastDays(7) },
        onClearDates = viewModel::clearDates,
        onDocumentClick = onDocumentClick,
        onCreateClick = onCreateClick,
        onClientTermChange = viewModel::onClientTermChange,
        onClientSelect = viewModel::selectClient,
        onClientClear = viewModel::clearClient,
        onAssetTermChange = viewModel::onAssetTermChange,
        onAssetSelect = viewModel::selectAsset,
        onAssetClear = viewModel::clearAsset,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DocumentListContent(
    uiState: DocumentListUiState,
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onLoadMore: () -> Unit,
    onStatusSelect: (DocumentStatus?) -> Unit,
    onTypeSelect: (DocumentType?) -> Unit,
    onStartDateSelect: (LocalDate?) -> Unit,
    onEndDateSelect: (LocalDate?) -> Unit,
    onToday: () -> Unit,
    onLast7Days: () -> Unit,
    onClearDates: () -> Unit,
    onDocumentClick: (Int) -> Unit,
    onCreateClick: () -> Unit,
    onClientTermChange: (String) -> Unit = {},
    onClientSelect: (ClientResponse) -> Unit = {},
    onClientClear: () -> Unit = {},
    onAssetTermChange: (String) -> Unit = {},
    onAssetSelect: (AssetResponse) -> Unit = {},
    onAssetClear: () -> Unit = {},
) {
    val listState = rememberLazyListState()
    var filtersExpanded by rememberSaveable { mutableStateOf(false) }

    val shouldLoadMore by remember {
        derivedStateOf {
            val last = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= uiState.documents.size - 3
        }
    }

    LaunchedEffect(shouldLoadMore, uiState.documents.size) {
        if (shouldLoadMore) onLoadMore()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ordens de Serviço") },
                actions = {
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
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateClick,
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Novo orçamento/OS")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            FiltersPanel(
                uiState = uiState,
                expanded = filtersExpanded,
                onToggle = { filtersExpanded = !filtersExpanded },
                onStatusSelect = onStatusSelect,
                onTypeSelect = onTypeSelect,
                onStartDateSelect = onStartDateSelect,
                onEndDateSelect = onEndDateSelect,
                onToday = onToday,
                onLast7Days = onLast7Days,
                onClearDates = onClearDates,
                onClientTermChange = onClientTermChange,
                onClientSelect = onClientSelect,
                onClientClear = onClientClear,
                onAssetTermChange = onAssetTermChange,
                onAssetSelect = onAssetSelect,
                onAssetClear = onAssetClear
            )

            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Text(
                    text = "Mostrando ${uiState.documents.size} de ${uiState.total}",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Toque em um documento para ver os detalhes. Use o botão + para criar um novo orçamento ou OS.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            PullToRefreshBox(
                isRefreshing = uiState.isRefreshing,
                onRefresh = onRefresh,
                modifier = Modifier.fillMaxSize()
            ) {
                when {
                    uiState.isLoading -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }

                    uiState.documents.isEmpty() -> {
                        Box(
                            Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "Nenhum documento encontrado",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = "Ajuste os filtros ou o período, ou toque em + para criar um novo documento.",
                                    style = MaterialTheme.typography.bodySmall,
                                    textAlign = TextAlign.Center,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    else -> {
                        LazyColumn(
                            state = listState,
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 16.dp, end = 16.dp, top = 4.dp, bottom = 96.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(items = uiState.documents, key = { it.id }) { document ->
                                DocumentCard(
                                    document = document,
                                    onClick = { onDocumentClick(document.id) }
                                )
                            }
                            if (uiState.isLoadingMore) {
                                item {
                                    Box(
                                        Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) { CircularProgressIndicator(modifier = Modifier.size(24.dp)) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FiltersPanel(
    uiState: DocumentListUiState,
    expanded: Boolean,
    onToggle: () -> Unit,
    onStatusSelect: (DocumentStatus?) -> Unit,
    onTypeSelect: (DocumentType?) -> Unit,
    onStartDateSelect: (LocalDate?) -> Unit,
    onEndDateSelect: (LocalDate?) -> Unit,
    onToday: () -> Unit,
    onLast7Days: () -> Unit,
    onClearDates: () -> Unit,
    onClientTermChange: (String) -> Unit,
    onClientSelect: (ClientResponse) -> Unit,
    onClientClear: () -> Unit,
    onAssetTermChange: (String) -> Unit,
    onAssetSelect: (AssetResponse) -> Unit,
    onAssetClear: () -> Unit
) {
    val today = LocalDate.now()
    val isToday = uiState.startDate == today && uiState.endDate == today
    val isWeek = uiState.startDate == today.minusDays(6) && uiState.endDate == today
    val isAll = uiState.startDate == null && uiState.endDate == null

    val statusOptions: List<Pair<String, DocumentStatus?>> =
        listOf("Todos" to null) + DocumentStatus.entries.map { it.label() to it }
    val typeOptions: List<Pair<String, DocumentType?>> =
        listOf("Todos" to null) + DocumentType.entries.map { it.label() to it }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onToggle),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Filtros",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Recolher filtros" else "Expandir filtros"
                )
            }

            if (expanded) {
                Column(
                    modifier = Modifier
                        .heightIn(max = 380.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Spacer(Modifier.height(12.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterDropdown(
                            label = "Status",
                            selectedText = uiState.status?.label() ?: "Todos",
                            options = statusOptions,
                            onSelect = onStatusSelect,
                            modifier = Modifier.weight(1f)
                        )
                        FilterDropdown(
                            label = "Tipo",
                            selectedText = uiState.type?.label() ?: "Todos",
                            options = typeOptions,
                            onSelect = onTypeSelect,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        DateField(
                            label = "Data inicial",
                            date = uiState.startDate,
                            onDateSelected = onStartDateSelect,
                            modifier = Modifier.weight(1f)
                        )
                        DateField(
                            label = "Data final",
                            date = uiState.endDate,
                            onDateSelected = onEndDateSelect,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        FilterChip(selected = isToday, onClick = onToday, label = { Text("Hoje") })
                        FilterChip(selected = isWeek, onClick = onLast7Days, label = { Text("7 dias") })
                        FilterChip(selected = isAll, onClick = onClearDates, label = { Text("Todo o período") })
                    }

                    Spacer(Modifier.height(12.dp))

                    SearchFilterField(
                        label = "Cliente",
                        placeholder = "Digite o nome do cliente...",
                        term = uiState.clientTerm,
                        results = uiState.clientResults,
                        resultText = { it.name },
                        capitalization = KeyboardCapitalization.Words,
                        onTermChange = onClientTermChange,
                        onSelect = onClientSelect,
                        onClear = onClientClear
                    )

                    Spacer(Modifier.height(8.dp))

                    SearchFilterField(
                        label = "Veículo",
                        placeholder = "Digite a placa...",
                        term = uiState.assetTerm,
                        results = uiState.assetResults,
                        resultText = { it.label },
                        capitalization = KeyboardCapitalization.Characters,
                        onTermChange = onAssetTermChange,
                        onSelect = onAssetSelect,
                        onClear = onAssetClear
                    )

                    Spacer(Modifier.height(4.dp))

                    Text(
                        text = "Digite para buscar e toque em um resultado para filtrar. O período considera a data de criação do documento.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
internal fun <T> SearchFilterField(
    label: String,
    placeholder: String,
    term: String,
    results: List<T>,
    resultText: (T) -> String,
    capitalization: KeyboardCapitalization,
    onTermChange: (String) -> Unit,
    onSelect: (T) -> Unit,
    onClear: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = term,
            onValueChange = onTermChange,
            singleLine = true,
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            keyboardOptions = KeyboardOptions(capitalization = capitalization),
            trailingIcon = {
                if (term.isNotEmpty()) {
                    IconButton(onClick = onClear) {
                        Icon(Icons.Default.Close, contentDescription = "Limpar $label")
                    }
                }
            },
            modifier = Modifier.fillMaxWidth()
        )

        if (results.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column {
                    results.forEach { item ->
                        Text(
                            text = resultText(item),
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(item) }
                                .padding(horizontal = 16.dp, vertical = 12.dp)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun <T> FilterDropdown(
    label: String,
    selectedText: String,
    options: List<Pair<String, T?>>,
    onSelect: (T?) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = selectedText,
            onValueChange = {},
            readOnly = true,
            singleLine = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                .fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { (text, value) ->
                DropdownMenuItem(
                    text = { Text(text) },
                    onClick = {
                        onSelect(value)
                        expanded = false
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateField(
    label: String,
    date: LocalDate?,
    onDateSelected: (LocalDate?) -> Unit,
    modifier: Modifier = Modifier
) {
    var showPicker by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        OutlinedTextField(
            value = date?.format(displayDateFormat) ?: "",
            onValueChange = {},
            readOnly = true,
            singleLine = true,
            label = { Text(label) },
            placeholder = { Text("dd/mm/aaaa") },
            trailingIcon = { Icon(Icons.Default.CalendarMonth, contentDescription = null) },
            modifier = Modifier.fillMaxWidth()
        )
        // Cobre o campo para abrir o calendário ao toque
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable { showPicker = true }
        )
    }

    if (showPicker) {
        val pickerState = rememberDatePickerState(
            initialSelectedDateMillis = date?.atStartOfDay(ZoneOffset.UTC)?.toInstant()?.toEpochMilli()
        )
        DatePickerDialog(
            onDismissRequest = { showPicker = false },
            confirmButton = {
                TextButton(onClick = {
                    pickerState.selectedDateMillis?.let { millis ->
                        onDateSelected(Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate())
                    }
                    showPicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showPicker = false }) { Text("Cancelar") }
            }
        ) {
            DatePicker(state = pickerState)
        }
    }
}

@Composable
private fun DocumentCard(document: DocumentResponse, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val statusColor = when (document.status) {
        DocumentStatus.CANCELED -> colors.error
        DocumentStatus.COMPLETED -> colors.primary
        else -> colors.onSurfaceVariant
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = colors.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "#${document.id} — ${document.clientName}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.onSurface
                )
                Text(
                    text = document.type.label(),
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(document.total),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = colors.onSurface
                )
                Text(
                    text = document.status.label(),
                    style = MaterialTheme.typography.bodySmall,
                    color = statusColor
                )
            }
        }
    }
}

// ── Previews ──────────────────────────────────────────────────────────────────

private val previewDocuments = listOf(
    DocumentResponse(
        id = 12, type = DocumentType.SERVICE_ORDER, status = DocumentStatus.IN_PROGRESS,
        clientId = 1, clientName = "João Silva", assetId = 3, responsibleId = null,
        responsibleName = null, total = 450.0, approvedAt = null, finishedAt = null,
        createdAt = "", updatedAt = ""
    ),
    DocumentResponse(
        id = 11, type = DocumentType.QUOTE, status = DocumentStatus.DRAFT,
        clientId = 2, clientName = "Maria Souza", assetId = null, responsibleId = null,
        responsibleName = null, total = 120.5, approvedAt = null, finishedAt = null,
        createdAt = "", updatedAt = ""
    ),
)

@Preview(showBackground = true, showSystemUi = true, name = "OS – lista")
@Composable
private fun DocumentListPreview() {
    BlueErpTheme {
        DocumentListContent(
            uiState = DocumentListUiState(documents = previewDocuments, total = 2),
            onRefresh = {}, onLogout = {}, onLoadMore = {},
            onStatusSelect = {}, onTypeSelect = {},
            onStartDateSelect = {}, onEndDateSelect = {},
            onToday = {}, onLast7Days = {}, onClearDates = {},
            onDocumentClick = {}, onCreateClick = {}
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "OS – vazia")
@Composable
private fun DocumentListEmptyPreview() {
    BlueErpTheme {
        DocumentListContent(
            uiState = DocumentListUiState(),
            onRefresh = {}, onLogout = {}, onLoadMore = {},
            onStatusSelect = {}, onTypeSelect = {},
            onStartDateSelect = {}, onEndDateSelect = {},
            onToday = {}, onLast7Days = {}, onClearDates = {},
            onDocumentClick = {}, onCreateClick = {}
        )
    }
}