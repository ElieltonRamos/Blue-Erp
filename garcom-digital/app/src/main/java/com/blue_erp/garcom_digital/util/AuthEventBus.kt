package com.blue_erp.garcom_digital.util

import kotlinx.coroutines.flow.MutableSharedFlow

object AuthEventBus {
    val unauthorized = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
}