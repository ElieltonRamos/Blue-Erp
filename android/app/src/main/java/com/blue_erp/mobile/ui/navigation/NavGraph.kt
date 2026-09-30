package com.blue_erp.mobile.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.blue_erp.mobile.ui.screens.login.LoginScreen
import com.blue_erp.mobile.util.AuthEventBus
import com.blue_erp.mobile.util.JwtDecoder

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Login.route,
    onToggleTheme: () -> Unit,
    isDarkTheme: Boolean
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
                    val destination = when (role) {
                        "cozinheiro" -> Screen.Kitchen.route
                        else -> Screen.Tables.route
                    }
                    navController.navigate(destination) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onToggleTheme = onToggleTheme,
                isDarkTheme = isDarkTheme
            )
        }

        restauranteGraph(navController)
        oficinaGraph(navController)
    }
}