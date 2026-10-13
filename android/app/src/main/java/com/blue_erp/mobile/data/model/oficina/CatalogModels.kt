package com.blue_erp.mobile.data.model.oficina

data class ServiceResponse(
    val id: Int,
    val name: String,
    val code: String,
    val price: Double,
    val estimatedTime: Int?,
    val active: Boolean
)

// Peça ou serviço, no formato que a busca da OS precisa
data class CatalogOption(
    val id: Int,
    val name: String,
    val price: Double
)