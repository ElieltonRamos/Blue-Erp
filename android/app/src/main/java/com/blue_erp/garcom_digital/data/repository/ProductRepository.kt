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
class ProductRepository @Inject constructor(
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

    suspend fun getProducts(search: String? = null, categoryId: Int? = null): Resource<List<ProductResponse>> {
        return try {
            val response = apiService.getProducts(search = search, categoryId = categoryId)
            if (response.isSuccessful) {
                Resource.Success(response.body()?.data ?: emptyList())
            } else Resource.Error(parseError(response, "Erro ao buscar produtos"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun getCategories(): Resource<List<CategoryResponse>> {
        return try {
            val response = apiService.getCategories()
            if (response.isSuccessful) {
                Resource.Success(response.body()?.data ?: emptyList())
            } else Resource.Error(parseError(response, "Erro ao buscar categorias"))
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }
}