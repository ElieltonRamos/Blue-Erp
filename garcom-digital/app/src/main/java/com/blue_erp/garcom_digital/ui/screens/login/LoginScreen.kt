package com.blue_erp.garcom_digital.ui.screens.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.blue_erp.garcom_digital.R

// Cores mais claras
private val BackgroundLight = Color(0xFF2D2D4A)
private val BackgroundMedium = Color(0xFF1E1E3A)
private val SurfaceColor = Color(0xFF3D3D5C)
private val PurpleAccent = Color(0xFF7B2CBF)
private val TextPrimary = Color.White
private val TextSecondary = Color(0xFFB0B0B0)

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }

    LoginScreenContent(
        uiState = uiState,
        onUsernameChange = viewModel::onUsernameChange,
        onPasswordChange = viewModel::onPasswordChange,
        onLogin = viewModel::login,
        onClearLicenseWarning = viewModel::clearLicenseWarning
    )
}

@Composable
private fun LoginScreenContent(
    uiState: LoginUiState,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onLogin: () -> Unit,
    onClearLicenseWarning: () -> Unit
) {
    var passwordVisible by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    // Detecta se o teclado está aberto
    val density = LocalDensity.current
    val imeBottom = WindowInsets.ime.getBottom(density)
    val imeVisible = imeBottom > 0

    val logoSize = if (imeVisible) 80.dp else 160.dp

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(BackgroundLight, BackgroundMedium)
                )
            )
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(if (imeVisible) 16.dp else 48.dp))

            // Logo - reduz quando teclado abre
            Image(
                painter = painterResource(id = R.drawable.logo_app_garcom),
                contentDescription = "Logo Garçom Digital",
                modifier = Modifier.size(logoSize)
            )

            Spacer(modifier = Modifier.height(if (imeVisible) 24.dp else 48.dp))

            // Campo Usuário
            OutlinedTextField(
                value = uiState.username,
                onValueChange = onUsernameChange,
                label = { Text("Usuário") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = SurfaceColor,
                    focusedBorderColor = PurpleAccent,
                    unfocusedLabelColor = TextSecondary,
                    focusedLabelColor = PurpleAccent,
                    cursorColor = PurpleAccent,
                    unfocusedContainerColor = SurfaceColor,
                    focusedContainerColor = SurfaceColor,
                    unfocusedTextColor = TextPrimary,
                    focusedTextColor = TextPrimary
                ),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                ),
                enabled = !uiState.isLoading
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Campo Senha
            OutlinedTextField(
                value = uiState.password,
                onValueChange = onPasswordChange,
                label = { Text("Senha") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = SurfaceColor,
                    focusedBorderColor = PurpleAccent,
                    unfocusedLabelColor = TextSecondary,
                    focusedLabelColor = PurpleAccent,
                    cursorColor = PurpleAccent,
                    unfocusedContainerColor = SurfaceColor,
                    focusedContainerColor = SurfaceColor,
                    unfocusedTextColor = TextPrimary,
                    focusedTextColor = TextPrimary
                ),
                visualTransformation = if (passwordVisible) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) {
                                Icons.Default.VisibilityOff
                            } else {
                                Icons.Default.Visibility
                            },
                            contentDescription = null,
                            tint = TextSecondary
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        focusManager.clearFocus()
                        onLogin()
                    }
                ),
                enabled = !uiState.isLoading
            )

            // Erro
            uiState.error?.let { error ->
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = error,
                    color = Color(0xFFFF6B6B),
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Botão Entrar
            Button(
                onClick = onLogin,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = PurpleAccent,
                    disabledContainerColor = PurpleAccent.copy(alpha = 0.5f)
                ),
                enabled = !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = "Entrar",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Espaço extra para permitir scroll quando teclado está aberto
            Spacer(modifier = Modifier.height(300.dp))
        }
    }

    // Dialog de licença
    uiState.licenseWarning?.let { warning ->
        AlertDialog(
            onDismissRequest = onClearLicenseWarning,
            title = { Text("Aviso de Licença") },
            text = { Text(warning) },
            confirmButton = {
                TextButton(onClick = onClearLicenseWarning) {
                    Text("OK", color = PurpleAccent)
                }
            },
            containerColor = SurfaceColor,
            titleContentColor = TextPrimary,
            textContentColor = TextSecondary
        )
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun LoginScreenPreview() {
    MaterialTheme {
        LoginScreenContent(
            uiState = LoginUiState(),
            onUsernameChange = {},
            onPasswordChange = {},
            onLogin = {},
            onClearLicenseWarning = {}
        )
    }
}