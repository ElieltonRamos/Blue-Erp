package com.blue_erp.garcom_digital

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.navigation.compose.rememberNavController
import com.blue_erp.garcom_digital.ui.navigation.NavGraph
import com.blue_erp.garcom_digital.ui.navigation.Screen
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme
import com.blue_erp.garcom_digital.util.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            GarcomDigitalTheme {
                val navController = rememberNavController()

                // Estado para armazenar a rota inicial calculada
                var startDestination by remember { mutableStateOf<String?>(null) }

                LaunchedEffect(Unit) {
                    val token = tokenManager.getToken() // Supondo que você tenha esse método

                    startDestination = if (!token.isNullOrBlank()) {
                        val role = com.blue_erp.garcom_digital.util.JwtDecoder.getRole(token)

                        // Lógica de proteção de rotas por cargo
                        when (role) {
                            "cozinheiro", "admin" -> Screen.Kitchen.route
                            else -> Screen.Tables.route
                        }
                    } else {
                        Screen.Login.route
                    }
                }

                // Só carrega o NavGraph quando a rota inicial for decidida
                startDestination?.let { destination ->
                    NavGraph(
                        navController = navController,
                        startDestination = destination
                    )
                }
            }
        }
    }
}