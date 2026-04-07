package com.blue_erp.garcom_digital.data.model

import java.util.Date

enum class ProductionStatus {
    PENDING, IN_PROGRESS, COMPLETED, CANCELED
}

enum class TimeBadgeColor {
    GREEN, YELLOW, RED
}

data class PreparationStep(
    val id: Int,
    val order: Int,
    val description: String,
    val productId: Int,
    val createdAt: String,
    val updatedAt: String
)

data class Recipe(
    val title: String,
    val prepTime: String,
    val ingredients: List<String>,
    val steps: List<String>
)

data class KitchenOrderItem(
    val id: Int,
    val productId: Int,
    val name: String,
    val code: String,
    val quantity: Int,
    val notes: String? = null,
    val recipe: Recipe? = null,
    val observation: String? = null,
    val preparationSteps: List<PreparationStep>? = null,
    val productionId: Int,
    val productionStatus: ProductionStatus,
    val productionLocation: String,
    val pendingAt: Date,
    val startedAt: Date? = null,
    val completedAt: Date? = null,
    val pendingDuration: Long? = null,
    val inProgressDuration: Long? = null,
    val totalDuration: Long? = null,
    val orderId: Int,
    val orderNumber: String,
    val table: String,
    val customerName: String,
    val type: String,
    val kitchen: String
)