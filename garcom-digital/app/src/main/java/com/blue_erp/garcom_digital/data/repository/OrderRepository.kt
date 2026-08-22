package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.util.Resource
import com.blue_erp.garcom_digital.util.parseNetworkError
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(
    private val apiService: ApiService
) {

    private fun parseError(response: Response<*>, fallback: String): String {
        return when (response.code()) {
            401 -> "Sessão expirada. Faça login novamente."
            403 -> "Sem permissão para esta ação."
            404 -> "Registro não encontrado."
            500, 502, 503 -> "Servidor indisponível. Tente mais tarde."
            else -> try {
                val json = response.errorBody()?.string()
                JSONObject(json ?: "").getString("message")
            } catch (e: Exception) {
                fallback
            }
        }
    }

    suspend fun updateOrder(orderId: Int, request: UpdateOrderRequest): Resource<TableOrder> {
        return try {
            val response = apiService.updateOrder(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao salvar comanda")
            } else Resource.Error(parseError(response, "Erro ao salvar comanda"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun addItems(orderId: Int, request: AddOrderItemsRequest): Resource<TableOrder> {
        return try {
            val response = apiService.addOrderItems(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao adicionar item")
            } else Resource.Error(parseError(response, "Erro ao adicionar item"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun removeItems(orderId: Int, request: RemoveOrderItemsRequest): Resource<TableOrder> {
        return try {
            val response = apiService.removeOrderItems(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao remover item")
            } else Resource.Error(parseError(response, "Erro ao remover item"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun updateServiceCharge(orderId: Int, request: UpdateServiceChargeRequest): Resource<TableOrder> {
        return try {
            val response = apiService.updateServiceCharge(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao atualizar taxa de serviço")
            } else Resource.Error(parseError(response, "Erro ao atualizar taxa de serviço"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun getOrder(orderId: Int): Resource<TableOrder> {
        return try {
            val response = apiService.getOrder(orderId)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao buscar comanda")
            } else Resource.Error(parseError(response, "Erro ao buscar comanda"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }
}