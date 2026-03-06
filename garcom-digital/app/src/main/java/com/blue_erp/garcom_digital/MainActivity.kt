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

                // null = ainda verificando, true/false = resultado
                var isLoggedIn by remember { mutableStateOf<Boolean?>(null) }

                LaunchedEffect(Unit) {
                    isLoggedIn = tokenManager.isLoggedIn()
                }

                if (isLoggedIn != null) {
                    val startDestination = if (isLoggedIn == true) {
                        Screen.Tables.route
                    } else {
                        Screen.Login.route
                    }

                    NavGraph(
                        navController = navController,
                        startDestination = startDestination
                    )
                }
                // isLoggedIn == null: não renderiza nada (ou coloque um SplashScreen aqui)
            }
        }
    }
}