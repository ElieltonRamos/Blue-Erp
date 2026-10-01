package com.blue_erp.mobile.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable
import com.blue_erp.mobile.ui.screens.oficina.documents.DocumentListScreen

fun NavGraphBuilder.oficinaGraph(navController: NavHostController) {
    composable(Screen.Documents.route) {
        DocumentListScreen(
            onLogout = {
                navController.navigate(Screen.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            },
            onDocumentClick = { /* detalhe: próximo passo */ },
            onCreateClick = { /* criação: próximo passo */ }
        )
    }
}