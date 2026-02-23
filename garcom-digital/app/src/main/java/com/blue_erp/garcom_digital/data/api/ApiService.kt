package com.blue_erp.garcom_digital.data.api

import com.blue_erp.garcom_digital.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("users/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    // Tables
    @GET("tables")
    suspend fun getTables(@Query("locationId") locationId: Int? = null): Response<List<TableResponse>>

    @GET("tables/{id}")
    suspend fun getTable(@Path("id") id: Int): Response<TableResponse>

    @PATCH("tables/{id}/occupy")
    suspend fun occupyTable(
        @Path("id") id: Int,
        @Body request: OccupyTableRequest
    ): Response<TableResponse>

    @PATCH("tables/{id}/release")
    suspend fun releaseTable(@Path("id") id: Int): Response<TableResponse>

    @PATCH("tables/{id}/reserve")
    suspend fun reserveTable(
        @Path("id") id: Int,
        @Body request: ReserveTableRequest
    ): Response<TableResponse>

    @POST("tables/{id}/close-tab")
    suspend fun closeTab(@Path("id") id: Int): Response<CloseTabResponse>
}
