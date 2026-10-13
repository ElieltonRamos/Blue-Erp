package com.blue_erp.mobile.data.api

import com.blue_erp.mobile.data.model.*
import com.blue_erp.mobile.data.model.oficina.AddDocumentItemRequest
import com.blue_erp.mobile.data.model.oficina.AssetResponse
import com.blue_erp.mobile.data.model.oficina.ClientResponse
import com.blue_erp.mobile.data.model.oficina.CreateDocumentRequest
import com.blue_erp.mobile.data.model.oficina.DocumentResponse
import com.blue_erp.mobile.data.model.oficina.DocumentStatus
import com.blue_erp.mobile.data.model.oficina.DocumentType
import com.blue_erp.mobile.data.model.oficina.FinalizeDocumentRequest
import com.blue_erp.mobile.data.model.oficina.PageResponse
import com.blue_erp.mobile.data.model.oficina.ServiceResponse
import com.blue_erp.mobile.data.model.oficina.UpdateDocumentItemRequest
import com.blue_erp.mobile.data.model.oficina.UpdateDocumentResponsibleRequest
import com.blue_erp.mobile.data.model.oficina.UpdateDocumentStatusRequest
import com.blue_erp.mobile.data.model.restaurante.AddOrderItemsRequest
import com.blue_erp.mobile.data.model.restaurante.CloseTabRequest
import com.blue_erp.mobile.data.model.restaurante.CloseTabResponse
import com.blue_erp.mobile.data.model.restaurante.OccupyTableRequest
import com.blue_erp.mobile.data.model.restaurante.PaginatedProductResponse
import com.blue_erp.mobile.data.model.restaurante.ProductionLocationResponse
import com.blue_erp.mobile.data.model.restaurante.ProductionResponse
import com.blue_erp.mobile.data.model.restaurante.RemoveOrderItemsRequest
import com.blue_erp.mobile.data.model.restaurante.ReserveTableRequest
import com.blue_erp.mobile.data.model.restaurante.TableOrder
import com.blue_erp.mobile.data.model.restaurante.TableResponse
import com.blue_erp.mobile.data.model.restaurante.UpdateOrderRequest
import com.blue_erp.mobile.data.model.restaurante.UpdateServiceChargeRequest
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("users/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    // Production Locations
    @GET("production-locations")
    suspend fun getLocations(): Response<List<ProductionLocationResponse>>

    // Kitchen
    @GET("production")
    suspend fun getKitchenOrders(): Response<List<ProductionResponse>>

    @GET("production/location/{location}")
    suspend fun getKitchenOrdersByLocation(@Path("location") location: String): Response<List<ProductionResponse>>

    @POST("production/{id}/start")
    suspend fun startProduction(@Path("id") id: Int): Response<Unit>

    @POST("production/{id}/complete")
    suspend fun completeProduction(@Path("id") id: Int): Response<Unit>

    @POST("production/{id}/deliver")
    suspend fun deliverProduction(@Path("id") id: Int): Response<Unit>

    @PATCH("production/{id}/cancel")
    suspend fun cancelProduction(@Path("id") id: Int): Response<Unit>

    // Tables
    @GET("tables")
    suspend fun getTables(@Query("locationId") locationId: Int? = null): Response<List<TableResponse>>

    @GET("tables/{id}")
    suspend fun getTable(@Path("id") id: Int): Response<TableResponse>

    @PATCH("tables/{id}/occupy")
    suspend fun occupyTable(@Path("id") id: Int, @Body request: OccupyTableRequest): Response<TableResponse>

    @PATCH("tables/{id}/release")
    suspend fun releaseTable(@Path("id") id: Int): Response<TableResponse>

    @PATCH("tables/{id}/reserve")
    suspend fun reserveTable(@Path("id") id: Int, @Body request: ReserveTableRequest): Response<TableResponse>

    @POST("tables/{id}/close-tab")
    suspend fun closeTab(@Path("id") id: Int, @Body request: CloseTabRequest): Response<CloseTabResponse>

    // Orders
    @PATCH("orders/{id}")
    suspend fun updateOrder(@Path("id") id: Int, @Body request: UpdateOrderRequest): Response<TableOrder>

    @POST("orders/{id}/items")
    suspend fun addOrderItems(@Path("id") id: Int, @Body request: AddOrderItemsRequest): Response<TableOrder>

    @PATCH("orders/{id}/items/decrement")
    suspend fun removeOrderItems(@Path("id") id: Int, @Body request: RemoveOrderItemsRequest): Response<TableOrder>

    @PATCH("orders/{id}/service-charge")
    suspend fun updateServiceCharge(@Path("id") id: Int, @Body request: UpdateServiceChargeRequest): Response<TableOrder>

    @POST("orders/{id}/send-to-kitchen")
    suspend fun sendToKitchen(@Path("id") id: Int): Response<Unit>

    @GET("orders/{id}")
    suspend fun getOrder(@Path("id") id: Int): Response<TableOrder>

    @GET("categories")
    suspend fun getCategories(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 100,
        @Query("active") active: Boolean = true
    ): Response<PaginatedCategoryResponse>

    @GET("products")
    suspend fun getProducts(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 500,
        @Query("search") search: String? = null,
        @Query("active") active: Boolean = true,
        @Query("categoryId") categoryId: Int? = null
    ): Response<PaginatedProductResponse>

    // Clients
    @GET("clients/search")
    suspend fun searchClients(@Query("name") name: String): Response<List<ClientResponse>>

    // Assets
    @GET("assets")
    suspend fun getAssets(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("search") search: String? = null,
        @Query("clientId") clientId: Int? = null,
        @Query("type") type: String? = null,
        @Query("sortKey") sortKey: String = "clientId",
        @Query("sortOrder") sortOrder: String = "asc"
    ): Response<PageResponse<AssetResponse>>

    // Documents
    @GET("documents")
    suspend fun getDocuments(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("type") type: DocumentType? = null,
        @Query("status") status: DocumentStatus? = null,
        @Query("clientId") clientId: Int? = null,
        @Query("assetId") assetId: Int? = null,
        @Query("userId") userId: Int? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("minTotal") minTotal: Double? = null,
        @Query("maxTotal") maxTotal: Double? = null
    ): Response<PageResponse<DocumentResponse>>

    @GET("documents/{id}")
    suspend fun getDocument(@Path("id") id: Int): Response<DocumentResponse>

    @POST("documents")
    suspend fun createDocument(@Body request: CreateDocumentRequest): Response<DocumentResponse>

    @POST("documents/{id}/items")
    suspend fun addDocumentItem(@Path("id") id: Int, @Body request: AddDocumentItemRequest): Response<DocumentResponse>

    @PATCH("documents/{id}/items/{itemId}")
    suspend fun updateDocumentItem(
        @Path("id") id: Int,
        @Path("itemId") itemId: Int,
        @Body request: UpdateDocumentItemRequest
    ): Response<DocumentResponse>

    @DELETE("documents/{id}/items/{itemId}")
    suspend fun removeDocumentItem(@Path("id") id: Int, @Path("itemId") itemId: Int): Response<DocumentResponse>

    @PATCH("documents/{id}/approve")
    suspend fun approveDocument(@Path("id") id: Int): Response<DocumentResponse>

    @PATCH("documents/{id}/status")
    suspend fun updateDocumentStatus(@Path("id") id: Int, @Body request: UpdateDocumentStatusRequest): Response<DocumentResponse>

    @PATCH("documents/{id}/cancel")
    suspend fun cancelDocument(@Path("id") id: Int): Response<DocumentResponse>

    @PATCH("documents/{id}/reopen")
    suspend fun reopenDocument(@Path("id") id: Int): Response<DocumentResponse>

    @PATCH("documents/{id}/responsible")
    suspend fun updateDocumentResponsible(
        @Path("id") id: Int,
        @Body request: UpdateDocumentResponsibleRequest
    ): Response<DocumentResponse>

    // Users
    @GET("users")
    suspend fun getUsers(
        @Query("active") active: Boolean? = null,
        @Query("role") role: String? = null
    ): Response<List<UserResponse>>

    @GET("assets/{id}")
    suspend fun getAsset(@Path("id") id: Int): Response<AssetResponse>

    // Services (catálogo)
    @GET("services")
    suspend fun getServices(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10,
        @Query("search") search: String? = null,
        @Query("active") active: Boolean? = true,
        @Query("sortKey") sortKey: String = "name",
        @Query("sortOrder") sortOrder: String = "asc"
    ): Response<PageResponse<ServiceResponse>>

    @POST("sales/finalize-document/{id}")
    suspend fun finalizeDocument(@Path("id") id: Int, @Body request: FinalizeDocumentRequest): Response<Unit>
}