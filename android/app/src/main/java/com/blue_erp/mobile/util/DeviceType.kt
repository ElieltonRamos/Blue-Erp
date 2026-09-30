package com.blue_erp.mobile.util

// utils/DeviceType.kt
import android.content.Context
import android.content.res.Configuration

fun Context.isAndroidTv(): Boolean {
    return (resources.configuration.uiMode and Configuration.UI_MODE_TYPE_MASK) ==
            Configuration.UI_MODE_TYPE_TELEVISION
}