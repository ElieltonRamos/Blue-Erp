package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.util.Resource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun updateOrder(orderId: Int, request: UpdateOrderRequest): Resource<TableOrder> {
        return try {
            val response = apiService.updateOrder(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao salvar comanda")
            } else Resource.Error("Erro ao salvar comanda: ${response.code()}")
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun getProducts(search: String? = null): Resource<List<ProductResponse>> {
        return try {
            val response = apiService.getProducts(search = search)
            if (response.isSuccessful) {
                Resource.Success(response.body()?.data ?: emptyList())
            } else Resource.Error("Erro ao buscar produtos: ${response.code()}")
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }
}