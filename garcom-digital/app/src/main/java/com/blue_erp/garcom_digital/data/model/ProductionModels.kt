package com.blue_erp.garcom_digital.data.model

import com.google.gson.annotations.SerializedName
import java.util.Date

data class ProductionResponse(
    val id: Int,
    val status: String,
    val productionLocation: String,
    val pendingAt: Date,
    val startedAt: Date? = null,
    val completedAt: Date? = null,
    val pendingDuration: Long? = null,
    val inProgressDuration: Long? = null,
    val totalDuration: Long? = null,
    val observation: String? = null,
    val quantityRequested: Int,
    @SerializedName("orderItem")
    val orderItem: ProductionOrderItemResponse
)

data class ProductionOrderItemResponse(
    val id: Int,
    val name: String,
    val code: String,
    val quantity: Int? = null,
    val product: ProductionProductResponse,
    val order: ProductionOrderResponse
)

data class ProductionProductResponse(
    val id: Int,
    val preparationSteps: List<PreparationStepResponse>? = null
)

data class PreparationStepResponse(
    val id: Int,
    val order: Int,
    val description: String,
    val productId: Int,
    val createdAt: String,
    val updatedAt: String
)

data class ProductionOrderResponse(
    val id: Int,
    val table: String,
    val customerName: String,
    val type: String
)