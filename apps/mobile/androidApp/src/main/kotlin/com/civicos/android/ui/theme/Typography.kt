package com.civicos.android.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.civicos.android.R

val Poppins = FontFamily(
    Font(R.font.poppins_regular,  FontWeight.Normal),
    Font(R.font.poppins_medium,   FontWeight.Medium),
    Font(R.font.poppins_semibold, FontWeight.SemiBold),
    Font(R.font.poppins_bold,     FontWeight.Bold),
)

val CivicOSTypography = Typography(
    headlineLarge  = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Bold,     fontSize = 28.sp),
    headlineMedium = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.SemiBold, fontSize = 22.sp),
    titleLarge     = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.SemiBold, fontSize = 18.sp),
    titleMedium    = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Medium,   fontSize = 16.sp),
    bodyLarge      = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Normal,   fontSize = 16.sp),
    bodyMedium     = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Normal,   fontSize = 14.sp),
    labelLarge     = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Medium,   fontSize = 14.sp),
)
