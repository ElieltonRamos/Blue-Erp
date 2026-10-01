package com.blue_erp.mobile.data.repository.oficina

import com.blue_erp.mobile.data.api.ApiService
import com.blue_erp.mobile.data.model.oficina.*
import com.blue_erp.mobile.util.Resource
import com.blue_erp.mobile.util.parseNetworkError
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DocumentRepository @Inject constructor(
    private val apiService: ApiService
) {

    private fun parseError(response: Response<*>, fallback: String): String {
        return when (response.code()) {
            401 -> "Sessão expirada. Faça login novamente."
            403 -> "Sem permissão para esta ação."
            404 -> "Registro não encontrado."
            500, 502, 503 -> "Servidor indisponível. Tente mais tarde."
            else -> try {
                val json = response.errorBody()?.string()
                JSONObject(json ?: "").getString("message")
            } catch (e: Exception) {
                fallback
            }
        }
    }

    private suspend fun <T> safeCall(
        fallback: String,
        block: suspend () -> Response<T>
    ): Resource<T> {
        return try {
            val response = block()
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) }
                    ?: Resource.Error("Resposta vazia do servidor")
            } else {
                Resource.Error(parseError(response, fallback))
            }
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    // Listagem e detalhe

    suspend fun getDocuments(
        page: Int = 1,
        limit: Int = 20,
        filters: DocumentFilters = DocumentFilters()
    ): Resource<PageResponse<DocumentResponse>> =
        safeCall("Erro ao buscar documentos") {
            apiService.getDocuments(
                page = page,
                limit = limit,
                type = filters.type,
                status = filters.status,
                clientId = filters.clientId,
                assetId = filters.assetId,
                userId = filters.userId,
                startDate = filters.startDate,
                endDate = filters.endDate,
                minTotal = filters.minTotal,
                maxTotal = filters.maxTotal
            )
        }

    suspend fun getDocument(id: Int): Resource<DocumentResponse> =
        safeCall("Erro ao buscar documento") { apiService.getDocument(id) }

    // Criação

    suspend fun createDocument(request: CreateDocumentRequest): Resource<DocumentResponse> =
        safeCall("Erro ao criar documento") { apiService.createDocument(request) }

    // Itens

    suspend fun addItem(documentId: Int, request: AddDocumentItemRequest): Resource<DocumentResponse> =
        safeCall("Erro ao adicionar item") { apiService.addDocumentItem(documentId, request) }

    suspend fun updateItem(
        documentId: Int,
        itemId: Int,
        request: UpdateDocumentItemRequest
    ): Resource<DocumentResponse> =
        safeCall("Erro ao atualizar item") { apiService.updateDocumentItem(documentId, itemId, request) }

    suspend fun removeItem(documentId: Int, itemId: Int): Resource<DocumentResponse> =
        safeCall("Erro ao remover item") { apiService.removeDocumentItem(documentId, itemId) }

    // Status e responsável

    suspend fun approve(id: Int): Resource<DocumentResponse> =
        safeCall("Erro ao aprovar documento") { apiService.approveDocument(id) }

    suspend fun start(id: Int): Resource<DocumentResponse> =
        safeCall("Erro ao iniciar ordem de serviço") {
            apiService.updateDocumentStatus(id, UpdateDocumentStatusRequest(DocumentStatus.IN_PROGRESS))
        }

    suspend fun cancel(id: Int): Resource<DocumentResponse> =
        safeCall("Erro ao cancelar documento") { apiService.cancelDocument(id) }

    suspend fun reopen(id: Int): Resource<DocumentResponse> =
        safeCall("Erro ao reabrir documento") { apiService.reopenDocument(id) }

    suspend fun updateResponsible(id: Int, responsibleId: Int): Resource<DocumentResponse> =
        safeCall("Erro ao atualizar responsável") {
            apiService.updateDocumentResponsible(id, UpdateDocumentResponsibleRequest(responsibleId))
        }

    // Apoio à criação

    suspend fun searchClients(name: String): Resource<List<ClientResponse>> =
        safeCall("Erro ao buscar clientes") { apiService.searchClients(name) }

    suspend fun getAssets(
        clientId: Int? = null,
        search: String? = null
    ): Resource<PageResponse<AssetResponse>> =
        safeCall("Erro ao buscar veículos") {
            apiService.getAssets(search = search, clientId = clientId)
        }
}