package com.blue_erp.mobile.ui.navigation

sealed class Screen(val route: String) {
    data object Login   : Screen("login")
    data object Tables  : Screen("tables")
    data object Kitchen : Screen("kitchen")
    data object Order   : Screen("order/{tableId}") {
        fun createRoute(tableId: Int) = "order/$tableId"
    }
    data object Unavailable : Screen("unavailable")
    data object DocumentCreate : Screen("document_create")
    data object Documents   : Screen("documents")
    data object DocumentDetail : Screen("document_detail/{documentId}") {
        fun createRoute(documentId: Int) = "document_detail/$documentId"
    }
}