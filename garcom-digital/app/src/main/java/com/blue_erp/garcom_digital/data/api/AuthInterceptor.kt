package com.blue_erp.garcom_digital.data.api

import com.blue_erp.garcom_digital.util.AuthEventBus
import com.blue_erp.garcom_digital.util.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        if (originalRequest.url.encodedPath.contains("users/login")) {
            return chain.proceed(originalRequest)
        }

        val token = runBlocking { tokenManager.getToken() }

        val newRequest = if (token != null) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }

        val response = chain.proceed(newRequest)

        if (response.code == 401) {
            runBlocking { tokenManager.clearToken() }
            AuthEventBus.unauthorized.tryEmit(Unit)
        }

        return response
    }
}