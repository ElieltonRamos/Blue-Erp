package com.blue_erp.garcom_digital.data.model

import com.google.gson.annotations.SerializedName

data class UpdateOrderItemRequest(
    val id: Int? = null,
    val productId: Int,
    val code: String,
    val name: String,
    val quantity: Double,
    @SerializedName("unitPrice") val unitPrice: Double,
    val total: Double,
    val observation: String? = null,
)

data class UpdateOrderRequest(
    val items: List<UpdateOrderItemRequest>,
    val total: Double
)

data class ProductResponse(
    val id: Int,
    val name: String,
    val code: String,
    val price: Double,
    val unit: String,
    val active: Boolean,
    val quantity: Double? = null,
    val categoryId: Int?
)

data class PaginatedProductResponse(
    val data: List<ProductResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)