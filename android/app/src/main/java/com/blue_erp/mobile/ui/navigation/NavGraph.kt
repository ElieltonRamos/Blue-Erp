package com.blue_erp.mobile.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.blue_erp.mobile.ui.screens.login.LoginScreen
import com.blue_erp.mobile.ui.screens.unavailable.UnavailableScreen
import com.blue_erp.mobile.util.AuthEventBus

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
                    navController.navigate(destinationFor(token)) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onToggleTheme = onToggleTheme,
                isDarkTheme = isDarkTheme
            )
        }

        restauranteGraph(navController)
        oficinaGraph(navController)

        composable(Screen.Unavailable.route) {
            UnavailableScreen(
                onBack = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}