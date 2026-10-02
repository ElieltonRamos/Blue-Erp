package com.blue_erp.mobile.ui.screens.oficina.create_document

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.blue_erp.mobile.data.model.UserResponse
import com.blue_erp.mobile.data.model.oficina.AssetResponse
import com.blue_erp.mobile.data.model.oficina.ClientResponse
import com.blue_erp.mobile.data.model.oficina.DocumentType
import com.blue_erp.mobile.ui.screens.oficina.list_documents.FilterDropdown
import com.blue_erp.mobile.ui.screens.oficina.list_documents.SearchFilterField
import com.blue_erp.mobile.ui.screens.oficina.list_documents.label
import com.blue_erp.mobile.ui.theme.BlueErpTheme

@Composable
fun DocumentCreateScreen(
    onBack: () -> Unit,
    onCreated: (documentId: Int) -> Unit,
    viewModel: DocumentCreateViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    LaunchedEffect(uiState.createdDocumentId) {
        uiState.createdDocumentId?.let { id ->
            Toast.makeText(context, "Documento #$id criado com sucesso", Toast.LENGTH_SHORT).show()
            viewModel.consumeCreated()
            onCreated(id)
        }
    }

    DocumentCreateContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onBack = onBack,
        onTypeSelect = viewModel::setType,
        onClientTermChange = viewModel::onClientTermChange,
        onClientSelect = viewModel::selectClient,
        onClientClear = viewModel::clearClient,
        onAssetSelect = viewModel::selectAsset,
        onResponsibleSelect = viewModel::selectResponsible,
        onCreate = viewModel::create
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DocumentCreateContent(
    uiState: DocumentCreateUiState,
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    onBack: () -> Unit,
    onTypeSelect: (DocumentType) -> Unit,
    onClientTermChange: (String) -> Unit,
    onClientSelect: (ClientResponse) -> Unit,
    onClientClear: () -> Unit,
    onAssetSelect: (AssetResponse?) -> Unit,
    onResponsibleSelect: (UserResponse?) -> Unit,
    onCreate: () -> Unit
) {
    val colors = MaterialTheme.colorScheme

    val typeOptions: List<Pair<String, DocumentType?>> =
        DocumentType.entries.map { it.label() to it }
    val assetOptions: List<Pair<String, AssetResponse?>> =
        listOf("Nenhum" to null) + uiState.assets.map { it.label to it }
    val responsibleOptions: List<Pair<String, UserResponse?>> =
        listOf("Nenhum" to null) + uiState.users.map { it.username to it }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Novo orçamento/OS") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.primary,
                    titleContentColor = colors.onPrimary,
                    navigationIconContentColor = colors.onPrimary
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Escolha o tipo e o cliente. O veículo e o responsável são opcionais. As peças e os serviços são adicionados depois de criar o documento.",
                style = MaterialTheme.typography.bodySmall,
                color = colors.onSurfaceVariant
            )

            FilterDropdown(
                label = "Tipo",
                selectedText = uiState.type.label(),
                options = typeOptions,
                onSelect = { type -> type?.let(onTypeSelect) },
                modifier = Modifier.fillMaxWidth()
            )

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
            Text(
                text = "Digite o nome e toque no cliente na lista. Cliente novo? O cadastro é feito pelo sistema web.",
                style = MaterialTheme.typography.bodySmall,
                color = colors.onSurfaceVariant
            )

            when {
                uiState.client == null -> Text(
                    text = "Escolha o cliente para ver os veículos dele.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.onSurfaceVariant
                )

                uiState.isLoadingAssets -> Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    Text("Carregando veículos...", style = MaterialTheme.typography.bodySmall)
                }

                uiState.assets.isEmpty() -> Text(
                    text = "Este cliente não tem veículos cadastrados. O cadastro é feito pelo sistema web.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.onSurfaceVariant
                )

                else -> FilterDropdown(
                    label = "Veículo (opcional)",
                    selectedText = uiState.asset?.label ?: "Nenhum",
                    options = assetOptions,
                    onSelect = onAssetSelect,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            FilterDropdown(
                label = "Responsável (opcional)",
                selectedText = uiState.responsible?.username ?: "Nenhum",
                options = responsibleOptions,
                onSelect = onResponsibleSelect,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onBack,
                    enabled = !uiState.isCreating,
                    modifier = Modifier.weight(1f)
                ) { Text("Cancelar") }

                Button(
                    onClick = onCreate,
                    enabled = !uiState.isCreating,
                    modifier = Modifier.weight(1f)
                ) {
                    if (uiState.isCreating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = colors.onPrimary
                        )
                    } else {
                        Text("Criar")
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Criar OS")
@Composable
private fun DocumentCreatePreview() {
    BlueErpTheme {
        DocumentCreateContent(
            uiState = DocumentCreateUiState(
                clientTerm = "João",
                client = ClientResponse(id = 1, name = "João Silva"),
                assets = listOf(AssetResponse(id = 1, type = "VEHICLE", label = "ABC-1234", clientId = 1))
            ),
            onBack = {}, onTypeSelect = {}, onClientTermChange = {}, onClientSelect = {},
            onClientClear = {}, onAssetSelect = {}, onResponsibleSelect = {}, onCreate = {}
        )
    }
}