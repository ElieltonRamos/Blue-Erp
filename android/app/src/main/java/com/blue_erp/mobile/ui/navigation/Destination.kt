package com.blue_erp.mobile.ui.navigation

import com.blue_erp.mobile.data.model.BusinessType
import com.blue_erp.mobile.util.JwtDecoder

fun destinationFor(token: String): String {
    val role = JwtDecoder.getRole(token)
    return when (JwtDecoder.getBusinessType(token)) {
        BusinessType.RESTAURANTE ->
            if (role == "cozinheiro") Screen.Kitchen.route else Screen.Tables.route
        BusinessType.OFICINA -> Screen.Documents.route
        BusinessType.VAREJO, BusinessType.PDV -> Screen.Unavailable.route
    }
}