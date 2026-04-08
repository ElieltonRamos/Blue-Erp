package com.blue_erp.garcom_digital.data.repository

import com.blue_erp.garcom_digital.data.api.ApiService
import com.blue_erp.garcom_digital.data.model.LoginRequest
import com.blue_erp.garcom_digital.data.model.LoginResponse
import com.blue_erp.garcom_digital.util.Resource
import com.blue_erp.garcom_digital.util.TokenManager
import com.blue_erp.garcom_digital.util.parseNetworkError
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {

    suspend fun login(username: String, password: String): Resource<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(username, password))
            if (response.isSuccessful) {
                response.body()?.let { loginResponse ->
                    tokenManager.saveToken(loginResponse.token, username)
                    Resource.Success(loginResponse)
                } ?: Resource.Error("Resposta vazia do servidor")
            } else {
                val errorMessage = when (response.code()) {
                    400, 401 -> "Usuário ou senha inválidos"
                    403 -> "Acesso não permitido"
                    500, 502, 503 -> "Servidor indisponível. Tente mais tarde."
                    else -> "Erro ao fazer login"
                }
                Resource.Error(errorMessage)
            }
        } catch (e: Exception) {
            Resource.Error(parseNetworkError(e))
        }
    }

    suspend fun logout() {
        tokenManager.clearToken()
    }

    suspend fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()

    suspend fun getToken(): String? = tokenManager.getToken()
}