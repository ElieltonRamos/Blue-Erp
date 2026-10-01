package com.blue_erp.mobile.util

import java.text.NumberFormat
import java.util.Locale

private val brCurrency: NumberFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

fun formatCurrency(value: Double): String = brCurrency.format(value)