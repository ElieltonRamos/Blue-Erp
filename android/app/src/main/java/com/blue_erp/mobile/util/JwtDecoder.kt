package com.blue_erp.mobile.util

import android.util.Base64
import com.blue_erp.mobile.data.model.BusinessType
import org.json.JSONObject

object JwtDecoder {

    private fun payload(token: String): JSONObject? = try {
        val part = token.split(".").getOrNull(1)
        val decoded = Base64.decode(part, Base64.URL_SAFE or Base64.NO_PADDING)
        JSONObject(String(decoded))
    } catch (e: Exception) {
        null
    }

    fun getRole(token: String): String? =
        payload(token)?.optString("role")?.takeIf { it.isNotEmpty() }

    fun getBusinessType(token: String): BusinessType =
        BusinessType.from(payload(token)?.optString("businessType"))
            ?: BusinessType.RESTAURANTE
    // TODO: remover quando o backend enviar o businessType
}