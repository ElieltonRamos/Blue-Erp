package com.blue_erp.mobile.util

import kotlinx.coroutines.flow.MutableSharedFlow

object AuthEventBus {
    val unauthorized = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
}