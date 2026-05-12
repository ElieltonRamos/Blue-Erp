package com.blue_erp.garcom_digital.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val AppDarkColorScheme = darkColorScheme(
    primary              = AccentDark,
    onPrimary            = BtnPrimaryTextDark,
    primaryContainer     = AccentHoverDark,
    onPrimaryContainer   = TextPrimaryDark,
    secondary            = PendingDark,
    onSecondary          = BaseDark,
    secondaryContainer   = OverlayDark,
    onSecondaryContainer = TextPrimaryDark,
    background           = BaseDark,
    onBackground         = TextPrimaryDark,
    surface              = SurfaceDark,
    onSurface            = TextPrimaryDark,
    surfaceVariant       = SurfaceAltDark,
    onSurfaceVariant     = TextSecondaryDark,
    error                = DangerDark,
    onError              = TextPrimaryDark,
    outline              = BorderDark,
    outlineVariant       = BorderSubtleDark,
)

private val AppLightColorScheme = lightColorScheme(
    primary              = AccentLight,
    onPrimary            = BtnPrimaryTextLight,
    primaryContainer     = AccentHoverLight,
    onPrimaryContainer   = TextPrimaryLight,
    secondary            = PendingLight,
    onSecondary          = BaseLight,
    secondaryContainer   = OverlayLight,
    onSecondaryContainer = TextPrimaryLight,
    background           = BaseLight,
    onBackground         = TextPrimaryLight,
    surface              = SurfaceLight,
    onSurface            = TextPrimaryLight,
    surfaceVariant       = SurfaceAltLight,
    onSurfaceVariant     = TextSecondaryLight,
    error                = DangerLight,
    onError              = TextPrimaryLight,
    outline              = BorderLight,
    outlineVariant       = BorderSubtleLight
)

@Composable
fun GarcomDigitalTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) AppDarkColorScheme else AppLightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}