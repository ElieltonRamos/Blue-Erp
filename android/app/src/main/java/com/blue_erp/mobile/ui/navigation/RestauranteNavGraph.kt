package com.blue_erp.mobile.ui.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.blue_erp.mobile.ui.screens.restaurante.kitchen_display.KitchenDisplayScreen
import com.blue_erp.mobile.ui.screens.restaurante.order.OrderScreen
import com.blue_erp.mobile.ui.screens.restaurante.tables.TablesScreen

fun NavGraphBuilder.restauranteGraph(navController: NavHostController) {
    composable(Screen.Tables.route) {
        TablesScreen(
            onLogout = {
                navController.navigate(Screen.Login.route) {
                    popUpTo(Screen.Tables.route) { inclusive = true }
                }
            },
            onTableClick = { tableId, _ ->
                navController.navigate(Screen.Order.createRoute(tableId))
            },
            onNavigateToKitchen = {
                navController.navigate(Screen.Kitchen.route) {
                    popUpTo(Screen.Tables.route) { inclusive = false }
                }
            }
        )
    }

    composable(Screen.Kitchen.route) {
        KitchenDisplayScreen(
            onLogout = {
                navController.navigate(Screen.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            },
            onNavigateToTables = {
                navController.navigate(Screen.Tables.route) {
                    popUpTo(Screen.Kitchen.route) { inclusive = false }
                }
            }
        )
    }

    composable(
        route = Screen.Order.route,
        arguments = listOf(navArgument("tableId") { type = NavType.IntType })
    ) {
        OrderScreen(onBack = { navController.popBackStack() })
    }
}