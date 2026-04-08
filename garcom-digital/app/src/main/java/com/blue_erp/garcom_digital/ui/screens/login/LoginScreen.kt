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
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
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
import com.blue_erp.garcom_digital.ui.theme.GarcomDigitalTheme
import com.blue_erp.garcom_digital.util.isAndroidTv

@Composable
fun LoginScreen(
    onLoginSuccess: (token: String) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val isTV = remember { context.isAndroidTv() }

    LaunchedEffect(uiState.isLoggedIn, uiState.token) {
        if (uiState.isLoggedIn && uiState.token != null) {
            onLoginSuccess(uiState.token!!)
        }
    }

    LoginScreenContent(
        uiState = uiState,
        onUsernameChange = viewModel::onUsernameChange,
        onPasswordChange = viewModel::onPasswordChange,
        onLogin = viewModel::login,
        onClearLicenseWarning = viewModel::clearLicenseWarning,
        isTV = isTV
    )
}

@Composable
private fun LoginScreenContent(
    uiState: LoginUiState,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onLogin: () -> Unit,
    onClearLicenseWarning: () -> Unit,
    isTV: Boolean = false
) {
    var passwordVisible by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()
    val colors = MaterialTheme.colorScheme

    // foco automático no campo usuário (só TV)
    val usernameFocusRequester = remember { FocusRequester() }
    val loginButtonFocusRequester = remember { FocusRequester() }

    if (isTV) {
        LaunchedEffect(Unit) {
            usernameFocusRequester.requestFocus()
        }
    }

    // no TV: sem detecção de IME (teclado é overlay, não empurra layout)
    val density = LocalDensity.current
    val imeBottom = if (isTV) 0 else WindowInsets.ime.getBottom(density)
    val imeVisible = imeBottom > 0
    val logoSize = if (imeVisible) 80.dp else 160.dp

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(colors.surfaceVariant, colors.background)))
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

            Image(
                painter = painterResource(id = R.drawable.logo_app_garcom),
                contentDescription = "Logo Garçom Digital",
                modifier = Modifier.size(logoSize)
            )

            Spacer(modifier = Modifier.height(if (imeVisible) 24.dp else 48.dp))

            OutlinedTextField(
                value = uiState.username,
                onValueChange = onUsernameChange,
                label = { Text("Usuário") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .then(if (isTV) Modifier.focusRequester(usernameFocusRequester) else Modifier),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = colors.surface,
                    focusedBorderColor = colors.primary,
                    unfocusedLabelColor = colors.onSurfaceVariant,
                    focusedLabelColor = colors.primary,
                    cursorColor = colors.primary,
                    unfocusedContainerColor = colors.surface,
                    focusedContainerColor = colors.surface,
                    unfocusedTextColor = colors.onSurface,
                    focusedTextColor = colors.onSurface
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

            OutlinedTextField(
                value = uiState.password,
                onValueChange = onPasswordChange,
                label = { Text("Senha") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = colors.surface,
                    focusedBorderColor = colors.primary,
                    unfocusedLabelColor = colors.onSurfaceVariant,
                    focusedLabelColor = colors.primary,
                    cursorColor = colors.primary,
                    unfocusedContainerColor = colors.surface,
                    focusedContainerColor = colors.surface,
                    unfocusedTextColor = colors.onSurface,
                    focusedTextColor = colors.onSurface
                ),
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    // no TV: remove o IconButton do traversal de foco
                    IconButton(
                        onClick = { passwordVisible = !passwordVisible },
                        modifier = if (isTV) Modifier.focusProperties { canFocus = false } else Modifier
                    ) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = null,
                            tint = colors.onSurfaceVariant
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
                        if (isTV) loginButtonFocusRequester.requestFocus()
                        onLogin()
                    }
                ),
                enabled = !uiState.isLoading
            )

            uiState.error?.let { error ->
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = error, color = colors.error, fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = onLogin,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .then(if (isTV) Modifier.focusRequester(loginButtonFocusRequester) else Modifier),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.primary,
                    disabledContainerColor = colors.primary.copy(alpha = 0.5f)
                ),
                enabled = !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = colors.onPrimary,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(text = "Entrar", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.height(300.dp))
        }
    }

    uiState.licenseWarning?.let { warning ->
        val dialogFocusRequester = remember { FocusRequester() }

        if (isTV) {
            LaunchedEffect(Unit) {
                dialogFocusRequester.requestFocus()
            }
        }

        AlertDialog(
            onDismissRequest = onClearLicenseWarning,
            title = { Text("Aviso de Licença") },
            text = { Text(warning) },
            confirmButton = {
                TextButton(
                    onClick = onClearLicenseWarning,
                    modifier = if (isTV) Modifier.focusRequester(dialogFocusRequester) else Modifier
                ) {
                    Text("OK", color = colors.primary)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.onSurface,
            textContentColor = colors.onSurfaceVariant
        )
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun LoginScreenPreview() {
    GarcomDigitalTheme {
        LoginScreenContent(
            uiState = LoginUiState(),
            onUsernameChange = {},
            onPasswordChange = {},
            onLogin = {},
            onClearLicenseWarning = {}
        )
    }
}