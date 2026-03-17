// data/model/Table.kt
package com.blue_erp.garcom_digital.data.model

import com.blue_erp.garcom_digital.data.config.TableAlertConfig
import com.google.gson.annotations.SerializedName
import java.text.SimpleDateFormat
import java.util.*

enum class TableStatus {
    AVAILABLE,
    OCCUPIED,
    RESERVED
}

enum class TableAlertLevel {
    NONE,
    WARNING,
    CRITICAL
}

enum class TableAlertType {
    NONE,
    NO_FIRST_ORDER,    // Nunca fez pedido desde que sentou
    INACTIVE           // Muito tempo sem pedir nada novo
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
    val observation: String? = null,
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
    val productions: List<OrderProduction> = emptyList(),
    @SerializedName("createdAt")
    val createdAt: String? = null,
) {
    val isReady: Boolean
        get() = productions.any { production ->
            production.status == "COMPLETED"
                    && production.completedAt != null
                    && production.deliveredAt == null
        }

    val quantityReady: Double
        get() = productions
            .filter { it.status == "COMPLETED" && it.deliveredAt == null }
            .sumOf { it.quantityProduced }

    val producedQuantity: Double
        get() = productions
            .filter { it.status == "COMPLETED" }
            .sumOf { it.quantityProduced }

    val isPartiallyReady: Boolean
        get() = producedQuantity > 0 && producedQuantity < quantity

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
    // ========== ITENS PRONTOS ==========

    val readyItemsCount: Int
        get() = order?.items?.count { it.isReady } ?: 0

    val hasReadyItems: Boolean
        get() = readyItemsCount > 0

    // ========== ALERTAS DE MESA ==========

    /**
     * Tipo de alerta da mesa
     */
    val alertType: TableAlertType
        get() {
            if (status != TableStatus.OCCUPIED || order == null) {
                return TableAlertType.NONE
            }

            // Sem nenhum pedido ainda
            if (order.items.isEmpty()) {
                return if (minutesSinceOccupied >= TableAlertConfig.FIRST_ORDER_WARNING_MINUTES) {
                    TableAlertType.NO_FIRST_ORDER
                } else {
                    TableAlertType.NONE
                }
            }

            // Tem pedidos, mas está inativo há muito tempo
            if (minutesSinceLastOrder >= TableAlertConfig.INACTIVITY_WARNING_MINUTES) {
                return TableAlertType.INACTIVE
            }

            return TableAlertType.NONE
        }

    /**
     * Nível de severidade do alerta
     */
    val alertLevel: TableAlertLevel
        get() {
            return when (alertType) {
                TableAlertType.NO_FIRST_ORDER -> {
                    when {
                        minutesSinceOccupied >= TableAlertConfig.FIRST_ORDER_CRITICAL_MINUTES ->
                            TableAlertLevel.CRITICAL
                        minutesSinceOccupied >= TableAlertConfig.FIRST_ORDER_WARNING_MINUTES ->
                            TableAlertLevel.WARNING
                        else -> TableAlertLevel.NONE
                    }
                }
                TableAlertType.INACTIVE -> {
                    when {
                        minutesSinceLastOrder >= TableAlertConfig.INACTIVITY_CRITICAL_MINUTES ->
                            TableAlertLevel.CRITICAL
                        minutesSinceLastOrder >= TableAlertConfig.INACTIVITY_WARNING_MINUTES ->
                            TableAlertLevel.WARNING
                        else -> TableAlertLevel.NONE
                    }
                }
                TableAlertType.NONE -> TableAlertLevel.NONE
            }
        }

    /**
     * Se tem algum alerta ativo
     */
    val hasAlert: Boolean
        get() = alertType != TableAlertType.NONE

    /**
     * Mensagem do alerta
     */
    val alertMessage: String
        get() {
            return when (alertType) {
                TableAlertType.NO_FIRST_ORDER ->
                    TableAlertConfig.Messages.getFirstOrderMessage(minutesSinceOccupied)
                TableAlertType.INACTIVE ->
                    TableAlertConfig.Messages.getInactivityMessage(minutesSinceLastOrder)
                TableAlertType.NONE -> ""
            }
        }

    // ========== CÁLCULOS DE TEMPO ==========

    /**
     * Minutos desde que a mesa foi ocupada
     */
    val minutesSinceOccupied: Long
        get() {
            if (order == null) return 0
            return calculateMinutesSince(order.createdAt)
        }

    /**
     * Minutos desde o último pedido
     */
    val minutesSinceLastOrder: Long
        get() {
            if (order == null || order.items.isEmpty()) return 0

            val activeItems = order.items.filter { it.canceledAt == null }
            if (activeItems.isEmpty()) return 0

            val lastActivityTime = activeItems
                .mapNotNull { it.sentToKitchenAt ?: it.createdAt }
                .maxOrNull() ?: order.createdAt

            return calculateMinutesSince(lastActivityTime)
        }

    /**
     * Helper para calcular minutos desde uma data ISO
     */
    private fun calculateMinutesSince(isoDate: String): Long {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            val dateMillis = sdf.parse(isoDate)?.time ?: return 0

            val now = System.currentTimeMillis()
            (now - dateMillis) / 1000 / 60
        } catch (e: Exception) {
            0
        }
    }
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