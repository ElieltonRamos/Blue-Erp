package com.blue_erp.mobile.data.repository

import com.blue_erp.mobile.data.api.ApiService
import com.blue_erp.mobile.data.model.LoginRequest
import com.blue_erp.mobile.data.model.LoginResponse
import com.blue_erp.mobile.util.Resource
import com.blue_erp.mobile.util.TokenManager
import com.blue_erp.mobile.util.parseNetworkError
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