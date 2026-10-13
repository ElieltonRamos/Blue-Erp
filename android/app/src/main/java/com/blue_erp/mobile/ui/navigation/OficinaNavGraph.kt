package com.blue_erp.mobile.ui.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.blue_erp.mobile.ui.screens.oficina.create_document.DocumentCreateScreen
import com.blue_erp.mobile.ui.screens.oficina.detail_document.DocumentDetailScreen
import com.blue_erp.mobile.ui.screens.oficina.list_documents.DocumentListScreen

fun NavGraphBuilder.oficinaGraph(navController: NavHostController) {
    composable(Screen.Documents.route) {
        DocumentListScreen(
            onLogout = {
                navController.navigate(Screen.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            },
            onDocumentClick = { id ->
                navController.navigate(Screen.DocumentDetail.createRoute(id))
            },
            onCreateClick = { navController.navigate(Screen.DocumentCreate.route) }
        )
    }

    composable(Screen.DocumentCreate.route) {
        DocumentCreateScreen(
            onBack = { navController.popBackStack() },
            onCreated = { id ->
                // Abre o detalhe e remove a criação da pilha: voltar leva à listagem
                navController.navigate(Screen.DocumentDetail.createRoute(id)) {
                    popUpTo(Screen.DocumentCreate.route) { inclusive = true }
                }
            }
        )
    }

    composable(
        route = Screen.DocumentDetail.route,
        arguments = listOf(navArgument("documentId") { type = NavType.IntType })
    ) {
        DocumentDetailScreen(onBack = { navController.popBackStack() })
    }
}