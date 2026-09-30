package com.blue_erp.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.blue_erp.mobile.ui.navigation.NavGraph
import com.blue_erp.mobile.ui.navigation.Screen
import com.blue_erp.mobile.ui.theme.BlueErpTheme
import com.blue_erp.mobile.ui.theme.ThemeViewModel
import com.blue_erp.mobile.util.JwtDecoder
import com.blue_erp.mobile.util.TokenManager
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
            val themeViewModel: ThemeViewModel = viewModel()
            val isDarkTheme by themeViewModel.isDarkMode.collectAsState()

            BlueErpTheme(darkTheme = isDarkTheme) {
                val navController = rememberNavController()
                var startDestination by remember { mutableStateOf<String?>(null) }

                LaunchedEffect(Unit) {
                    val token = tokenManager.getToken()
                    startDestination = if (!token.isNullOrBlank()) {
                        when (JwtDecoder.getRole(token)) {
                            "cozinheiro" -> Screen.Kitchen.route
                            else -> Screen.Tables.route
                        }
                    } else {
                        Screen.Login.route
                    }
                }

                startDestination?.let { destination ->
                    NavGraph(
                        navController = navController,
                        startDestination = destination,
                        onToggleTheme = {
                            android.util.Log.d("THEME", "toggle called, current: $isDarkTheme")
                            themeViewModel.toggle()
                        },
                        isDarkTheme = isDarkTheme
                    )
                }
            }
        }
    }
}