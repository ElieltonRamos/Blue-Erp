package com.blue_erp.garcom_digital.util

import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLHandshakeException
import javax.net.ssl.SSLException

fun parseNetworkError(e: Exception): String = when {
    e is UnknownHostException
            || e.cause is UnknownHostException        -> "Sem conexão com a internet."

    e is SSLHandshakeException
            || e is SSLException
            || e.cause is SSLHandshakeException       -> "Falha na conexão com o servidor. Tente novamente."

    e is SocketTimeoutException
            || e.cause is SocketTimeoutException      -> "O servidor demorou para responder. Tente novamente."

    else                                      -> "Erro inesperado. Tente novamente."
}