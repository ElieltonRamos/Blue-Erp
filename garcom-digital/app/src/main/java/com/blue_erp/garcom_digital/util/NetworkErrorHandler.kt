package com.blue_erp.garcom_digital.util

import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLHandshakeException
import javax.net.ssl.SSLException
import android.util.Log
import java.net.ConnectException
import java.io.IOException

fun parseNetworkError(e: Exception): String {
    Log.e("NetworkError", "Exception: ${e::class.simpleName} | Cause: ${e.cause?.let { it::class.simpleName }} | Message: ${e.message}")

    return when {
        e is UnknownHostException
                || e.cause is UnknownHostException        -> "Sem conexão com a internet."

        e is SSLHandshakeException
                || e is SSLException
                || e.cause is SSLHandshakeException       -> "Falha na conexão com o servidor. Tente novamente."

        e is SocketTimeoutException
                || e.cause is SocketTimeoutException
                || e is ConnectException
                || e.cause is ConnectException            -> "Sinal fraco ou desconectado. Aproxime-se do roteador e tente novamente."

        else                                              -> "Erro inesperado. Tente novamente."
    }
}