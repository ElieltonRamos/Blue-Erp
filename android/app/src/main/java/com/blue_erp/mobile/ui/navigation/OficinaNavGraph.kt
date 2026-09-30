package com.blue_erp.mobile.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable

fun NavGraphBuilder.oficinaGraph(navController: NavHostController) {
    composable(Screen.Documents.route) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Oficina em construção")
        }
    }
}