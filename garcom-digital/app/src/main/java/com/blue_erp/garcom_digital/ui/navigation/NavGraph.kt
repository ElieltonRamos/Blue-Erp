package com.blue_erp.garcom_digital.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.blue_erp.garcom_digital.ui.screens.kitchen_display.KitchenDisplayScreen
import com.blue_erp.garcom_digital.ui.screens.login.LoginScreen
import com.blue_erp.garcom_digital.ui.screens.order.OrderScreen
import com.blue_erp.garcom_digital.ui.screens.tables.TablesScreen
import com.blue_erp.garcom_digital.util.AuthEventBus
import com.blue_erp.garcom_digital.util.JwtDecoder

sealed class Screen(val route: String) {
    data object Login   : Screen("login")
    data object Tables  : Screen("tables")
    data object Kitchen : Screen("kitchen")
    data object Order   : Screen("order/{tableId}") {
        fun createRoute(tableId: Int) = "order/$tableId"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Login.route
) {

    LaunchedEffect(Unit) {
        AuthEventBus.unauthorized.collect {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = { token ->
                    val role = JwtDecoder.getRole(token)
                    val destination = if (role == "cozinheiro") Screen.Kitchen.route else Screen.Tables.route
                    navController.navigate(destination) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Tables.route) {
            TablesScreen(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Tables.route) { inclusive = true }
                    }
                },
                onTableClick = { tableId, _ ->
                    navController.navigate(Screen.Order.createRoute(tableId))
                }
            )
        }

        composable(Screen.Kitchen.route) {
            KitchenDisplayScreen(
                onBack = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Order.route,
            arguments = listOf(navArgument("tableId") { type = NavType.IntType })
        ) {
            OrderScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}