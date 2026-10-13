package com.blue_erp.mobile.util

import java.text.NumberFormat
import java.util.Locale

private val brCurrency: NumberFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

fun formatCurrency(value: Double): String = brCurrency.format(value)

fun formatQuantity(value: Double): String =
    if (value % 1.0 == 0.0) value.toLong().toString()
    else "%.3f".format(Locale("pt", "BR"), value).trimEnd('0').trimEnd(',')