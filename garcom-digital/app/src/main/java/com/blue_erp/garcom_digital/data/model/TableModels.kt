package com.blue_erp.garcom_digital.data.model

import com.google.gson.annotations.SerializedName

enum class TableStatus {
    AVAILABLE,
    OCCUPIED,
    RESERVED
}

data class TableLocation(
    val id: Int,
    val code: String,
    val name: String
)

data class TableOrderItem(
    val id: Int,
    val code: String,
    val name: String,
    val quantity: Double,
    @SerializedName("unitPrice")
    val unitPrice: Double,
    val total: Double,
    @SerializedName("productId")
    val productId: Int
)

data class TableOrder(
    val id: Int,
    val type: String,
    @SerializedName("locationId")
    val locationId: String,
    @SerializedName("customerName")
    val customerName: String?,
    val status: String,
    val total: Double,
    val items: List<TableOrderItem>,
    @SerializedName("createdAt")
    val createdAt: String
)

data class TableResponse(
    val id: Int,
    val number: Int,
    val capacity: Int,
    val status: TableStatus,
    val customer: String?,
    val time: String?,
    @SerializedName("locationId")
    val locationId: Int,
    val location: TableLocation,
    @SerializedName("orderId")
    val orderId: Int?,
    val order: TableOrder?,
    @SerializedName("createdAt")
    val createdAt: String,
    @SerializedName("updatedAt")
    val updatedAt: String
)

data class OccupyTableRequest(
    val customer: String
)

data class ReserveTableRequest(
    val customer: String,
    val time: String
)

data class CloseTabResponse(
    @SerializedName("orderId")
    val orderId: Int,
    val total: Double,
    val message: String
)
