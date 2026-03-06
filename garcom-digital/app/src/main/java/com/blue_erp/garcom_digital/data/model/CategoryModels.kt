package com.blue_erp.garcom_digital.data.model

data class CategoryResponse(
    val id: Int,
    val name: String,
    val active: Boolean
)

data class PaginatedCategoryResponse(
    val data: List<CategoryResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)