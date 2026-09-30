package com.blue_erp.mobile.ui.navigation

sealed class Screen(val route: String) {
    data object Login   : Screen("login")
    data object Tables  : Screen("tables")
    data object Kitchen : Screen("kitchen")
    data object Order   : Screen("order/{tableId}") {
        fun createRoute(tableId: Int) = "order/$tableId"
    }
}