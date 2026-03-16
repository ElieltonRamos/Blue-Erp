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
    primary              = Purple500,
    onPrimary            = TextPrimary,
    primaryContainer     = Purple700,
    onPrimaryContainer   = TextPrimary,
    secondary            = Cyan500,
    onSecondary          = BackgroundDark,
    secondaryContainer   = Cyan300,
    onSecondaryContainer = BackgroundDark,
    background           = BackgroundDark,
    onBackground         = TextPrimary,
    surface              = SurfaceDark,
    onSurface            = TextPrimary,
    surfaceVariant       = SurfaceDarkVariant,
    onSurfaceVariant     = TextSecondary,
    error                = Red500,
    onError              = TextPrimary,
    outline              = SurfaceDark
)

private val AppLightColorScheme = lightColorScheme(
    primary              = Purple500,
    onPrimary            = TextPrimary,
    primaryContainer     = Purple100,
    onPrimaryContainer   = Purple900,
    secondary            = Cyan500,
    onSecondary          = BackgroundDark,
    secondaryContainer   = Cyan100,
    onSecondaryContainer = BackgroundDark,
    background           = BackgroundLight,
    onBackground         = OnSurfaceLight,
    surface              = SurfaceLight,
    onSurface            = OnSurfaceLight,
    surfaceVariant       = SurfaceLightVariant,
    onSurfaceVariant     = TextDisabled,
    error                = Red500,
    onError              = TextPrimary,
    outline              = SurfaceLightVariant
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