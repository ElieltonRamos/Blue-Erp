package com.blue_erp.garcom_digital.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    @SerializedName("licenseWarning")
    val licenseWarning: String? = null
)
