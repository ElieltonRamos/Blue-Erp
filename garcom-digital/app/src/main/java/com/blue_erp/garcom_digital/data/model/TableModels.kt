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

data class OrderProduction(
    val id: Int,
    val productionLocation: String,
    val status: String,
    val quantityRequested: Double,
    val quantityProduced: Double,
    @SerializedName("pendingAt")
    val pendingAt: String? = null,
    @SerializedName("startedAt")
    val startedAt: String? = null,
    @SerializedName("completedAt")
    val completedAt: String? = null,
    @SerializedName("deliveredAt")
    val deliveredAt: String? = null
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
    val productId: Int,
    val observations: String? = null,
    @SerializedName("productionLocation")
    val productionLocation: String? = null,
    @SerializedName("sentToKitchenAt")
    val sentToKitchenAt: String? = null,
    @SerializedName("kitchenReadyAt")
    val kitchenReadyAt: String? = null,
    @SerializedName("deliveredAt")
    val deliveredAt: String? = null,
    @SerializedName("canceledAt")
    val canceledAt: String? = null,
    val productions: List<OrderProduction> = emptyList()
) {
    // ✅ LÓGICA CORRIGIDA: Existe PELO MENOS UMA produção pronta não entregue?
    val isReady: Boolean
        get() = productions.any { production ->
            production.status == "COMPLETED"
                    && production.completedAt != null
                    && production.deliveredAt == null
        }

    // Quantidade de unidades prontas não entregues
    val quantityReady: Double
        get() = productions
            .filter { it.status == "COMPLETED" && it.deliveredAt == null }
            .sumOf { it.quantityProduced }

    // Quantidade total já produzida
    val producedQuantity: Double
        get() = productions
            .filter { it.status == "COMPLETED" }
            .sumOf { it.quantityProduced }

    // Item parcialmente pronto
    val isPartiallyReady: Boolean
        get() = producedQuantity > 0 && producedQuantity < quantity

    // Todas as produções foram entregues
    val isFullyDelivered: Boolean
        get() = productions.isNotEmpty() && productions.all { it.deliveredAt != null }
}

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
) {
    val readyItemsCount: Int
        get() = order?.items?.count { it.isReady } ?: 0

    val hasReadyItems: Boolean
        get() = readyItemsCount > 0
}

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