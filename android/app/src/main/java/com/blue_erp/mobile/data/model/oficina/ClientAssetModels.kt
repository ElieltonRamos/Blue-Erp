package com.blue_erp.mobile.data.model.oficina

data class ClientResponse(
    val id: Int,
    val name: String,
    val phone: String? = null,
    val address: String? = null,
    val cpf: String? = null,
    val active: Boolean = true
)

data class AssetResponse(
    val id: Int,
    val type: String,
    val label: String,
    val clientId: Int
)