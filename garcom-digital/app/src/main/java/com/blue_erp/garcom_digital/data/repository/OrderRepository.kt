package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.util.Resource
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(
    private val apiService: ApiService
) {

    private fun parseError(response: Response<*>, fallback: String): String {
        return try {
            val json = response.errorBody()?.string()
            JSONObject(json ?: "").getString("message")
        } catch (e: Exception) {
            "$fallback: ${response.code()}"
        }
    }

    suspend fun updateOrder(orderId: Int, request: UpdateOrderRequest): Resource<TableOrder> {
        return try {
            val response = apiService.updateOrder(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao salvar comanda")
            } else Resource.Error(parseError(response, "Erro ao salvar comanda"))
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }
}