package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.*
import com.blue_erp.garcom_digital.util.Resource
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductRepository @Inject constructor(
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

    suspend fun getProducts(search: String? = null, categoryId: Int? = null): Resource<List<ProductResponse>> {
        return try {
            val response = apiService.getProducts(search = search, categoryId = categoryId)
            if (response.isSuccessful) {
                Resource.Success(response.body()?.data ?: emptyList())
            } else Resource.Error(parseError(response, "Erro ao buscar produtos"))
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }

    suspend fun getCategories(): Resource<List<CategoryResponse>> {
        return try {
            val response = apiService.getCategories()
            if (response.isSuccessful) {
                Resource.Success(response.body()?.data ?: emptyList())
            } else Resource.Error(parseError(response, "Erro ao buscar categorias"))
        } catch (e: Exception) {
            Resource.Error("Erro de conexão: ${e.message}")
        }
    }
}