package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.util.Resource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TableRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getLocations(): Resource<List<ProductionLocationResponse>> {
        return try {
            val response = apiService.getLocations()
            if (response.isSuccessful) Resource.Success(response.body() ?: emptyList())
            else Resource.Error("Erro ao carregar locais: ${response.code()}")
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun getTables(locationId: Int? = null): Resource<List<TableResponse>> {
        return try {
            val response = apiService.getTables(locationId)
            if (response.isSuccessful) Resource.Success(response.body() ?: emptyList())
            else Resource.Error("Erro ao carregar mesas: ${response.code()}")
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun getTable(id: Int): Resource<TableResponse> {
        return try {
            val response = apiService.getTable(id)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Mesa não encontrada")
            } else Resource.Error("Erro ao carregar mesa: ${response.code()}")
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun occupyTable(id: Int, customer: String): Resource<TableResponse> {
        return try {
            val response = apiService.occupyTable(id, OccupyTableRequest(customer))
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao ocupar mesa")
            } else {
                Resource.Error(if (response.code() == 400) "Mesa já está ocupada" else "Erro: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun releaseTable(id: Int): Resource<TableResponse> {
        return try {
            val response = apiService.releaseTable(id)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao liberar mesa")
            } else {
                Resource.Error(if (response.code() == 400) "Finalize a comanda primeiro" else "Erro: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun reserveTable(id: Int, customer: String, time: String): Resource<TableResponse> {
        return try {
            val response = apiService.reserveTable(id, ReserveTableRequest(customer, time))
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao reservar mesa")
            } else {
                Resource.Error(if (response.code() == 400) "Mesa está ocupada" else "Erro: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun closeTab(id: Int): Resource<CloseTabResponse> {
        return try {
            val response = apiService.closeTab(id)
            if (response.isSuccessful) {
                response.body()?.let { Resource.Success(it) } ?: Resource.Error("Erro ao fechar comanda")
            } else {
                Resource.Error(if (response.code() == 400) "Mesa sem comanda ativa" else "Erro: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }
}