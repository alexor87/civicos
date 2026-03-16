package com.civicos.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// CivicOS brand tokens (mirrors tailwind.config.ts)
val CivicBlue   = Color(0xFF2960EC)  // primary
val CivicNavy   = Color(0xFF132F56)  // sidebar / dark
val CivicWhite  = Color(0xFFFFFFFF)

private val LightColorScheme = lightColorScheme(
    primary          = CivicBlue,
    onPrimary        = CivicWhite,
    secondary        = CivicNavy,
    onSecondary      = CivicWhite,
    background       = Color(0xFFF8FAFC),
    surface          = CivicWhite,
)

@Composable
fun CivicOSTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography  = CivicOSTypography,
        content     = content,
    )
}
