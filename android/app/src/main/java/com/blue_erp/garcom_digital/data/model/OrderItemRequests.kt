package com.blue_erp.garcom_digital.data.model

data class AddOrderItemRequest(
    val productId: Int,
    val code: String,
    val name: String,
    val quantity: Double,
    val unitPrice: Double,
    val observation: String? = null
)

data class AddOrderItemsRequest(
    val items: List<AddOrderItemRequest>
)

data class RemoveOrderItemRequest(
    val id: Int,
    val quantity: Double
)

data class RemoveOrderItemsRequest(
    val items: List<RemoveOrderItemRequest>
)

data class UpdateServiceChargeRequest(
    val enabled: Boolean,
    val amount: Double
)