package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.util.Resource
import com.blue_erp.garcom_digital.util.parseNetworkError
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TableRepository @Inject constructor(
    private val apiService: ApiService
) {

    private fun parseError(code: Int, specific400: String? = null): String = when (code) {
        400 -> specific400 ?: "Requisição inválida."
        401 -> "Sessão expirada. Faça login novamente."
        403 -> "Sem permissão para esta ação."
        404 -> "Registro não encontrado."
        500, 502, 503 -> "Servidor indisponível. Tente mais tarde."
        else -> "Erro inesperado ($code)."
    }

    suspend fun getLocations(): Resource<List<ProductionLocationResponse>> {
        return try {
            val response = apiService.getLocations()
            if (response.isSuccessful) Resource.Success(response.body() ?: emptyList())
            else Resource.Error(parseError(response.code()))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun getTables(locationId: Int? = null): Resource<List<TableResponse>> {
        return try {
            val response = apiService.getTables(locationId)
            if (response.isSuccessful) Resource.Success(response.body() ?: emptyList())
            else Resource.Error(parseError(response.code()))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun getTable(id: Int): Resource<TableResponse> {
        return try {
            val response = apiService.getTable(id)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Mesa não encontrada.")
            } else Resource.Error(parseError(response.code()))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun occupyTable(id: Int, customer: String): Resource<TableResponse> {
        return try {
            val response = apiService.occupyTable(id, OccupyTableRequest(customer))
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao ocupar mesa.")
            } else Resource.Error(parseError(response.code(), "Mesa já está ocupada."))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun releaseTable(id: Int): Resource<TableResponse> {
        return try {
            val response = apiService.releaseTable(id)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao liberar mesa.")
            } else Resource.Error(parseError(response.code(), "Finalize a comanda primeiro."))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun reserveTable(id: Int, customer: String, time: String): Resource<TableResponse> {
        return try {
            val response = apiService.reserveTable(id, ReserveTableRequest(customer, time))
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao reservar mesa.")
            } else Resource.Error(parseError(response.code(), "Mesa está ocupada."))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun closeTab(id: Int, serviceCharge: Double = 0.0): Resource<CloseTabResponse> {
        return try {
            val response = apiService.closeTab(id, CloseTabRequest(serviceCharge))
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao fechar comanda.")
            } else Resource.Error(parseError(response.code(), "Mesa sem comanda ativa."))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }
}