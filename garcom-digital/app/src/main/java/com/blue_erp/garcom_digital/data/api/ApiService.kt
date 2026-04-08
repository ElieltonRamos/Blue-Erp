package com.blue_erp.garcom_digital.data.api

import com.blue_erp.garcom_digital.data.model.*
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
    suspend fun closeTab(@Path("id") id: Int): Response<CloseTabResponse>

    // Orders
    @PATCH("orders/{id}")
    suspend fun updateOrder(@Path("id") id: Int, @Body request: UpdateOrderRequest): Response<TableOrder>

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
}