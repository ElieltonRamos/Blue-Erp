package com.blue_erp.garcom_digital.util

import android.util.Base64
import org.json.JSONObject

object JwtDecoder {

    fun getRole(token: String): String? {
        return try {
            val payload = token.split(".").getOrNull(1) ?: return null
            val decoded = Base64.decode(payload, Base64.URL_SAFE or Base64.NO_PADDING)
            JSONObject(String(decoded)).getString("role")
        } catch (e: Exception) {
            null
        }
    }
}