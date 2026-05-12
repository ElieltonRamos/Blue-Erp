package com.blue_erp.garcom_digital.ui.theme

import androidx.compose.ui.graphics.Color

// === Background / Base ===
val BaseDark             = Color(0xFF1A1A1F)
val SurfaceDark          = Color(0xFF242429)
val SurfaceAltDark       = Color(0xFF2E2E35)
val OverlayDark          = Color(0xFF35353D)

// === Borders ===
val BorderDark           = Color(0xFF3A3A42)
val BorderSubtleDark     = Color(0xFF2A2A31)

// === Text ===
val TextPrimaryDark      = Color(0xFFE8E8EC)
val TextSecondaryDark    = Color(0xFF9898A6)
val TextMutedDark        = Color(0xFF606070)

// === Accent ===
val AccentDark           = Color(0xFF4A6FA5)
val AccentHoverDark      = Color(0xFF3D5F8F)

// === States ===
val DangerDark           = Color(0xFF9B4545)
val SuccessDark          = Color(0xFF3D7A56)
val WarningDark          = Color(0xFF8A6D32)

// === Light theme ===
val BaseLight            = Color(0xFFE7E7E7)
val SurfaceLight         = Color(0xFFF4F4F4)
val SurfaceAltLight      = Color(0xFFD8D8D8)
val OverlayLight         = Color(0xFFC9C9C9)

val BorderLight          = Color(0xFFB5B5B5)
val BorderSubtleLight    = Color(0xFFD0D0D0)

val TextPrimaryLight     = Color(0xFF2F3A45)
val TextSecondaryLight   = Color(0xFF5F6B76)
val TextMutedLight       = Color(0xFF6B7A86)

val AccentLight          = Color(0xFF3A5A8A)
val AccentHoverLight     = Color(0xFF2D4A7A)

val DangerLight          = Color(0xFFB04C4C)
val SuccessLight         = Color(0xFF4F7D60)
val WarningLight         = Color(0xFFB38B3D)

// === KDS — Status ===
val PendingDark          = Color(0xFFCA8A04)
val PreparingDark        = Color(0xFF2563EB)
val ReadyDark            = Color(0xFF16A34A)

val PendingLight         = Color(0xFFB45309)
val PreparingLight       = Color(0xFF1D4ED8)
val ReadyLight           = Color(0xFF15803D)

// === KDS — Time badge ===
val TimeOkDark           = Color(0xFF4ADE80)
val TimeWarnDark         = Color(0xFFFACC15)
val TimeCriticalDark     = Color(0xFFF87171)

val TimeOkLight          = Color(0xFF16A34A)
val TimeWarnLight        = Color(0xFFCA8A04)
val TimeCriticalLight    = Color(0xFFDC2626)

// === KDS — Order type ===
val DineInDark           = Color(0xFF3B82F6)
val DeliveryDark         = Color(0xFFF97316)

val DineInLight          = Color(0xFF1D4ED8)
val DeliveryLight        = Color(0xFFC2410C)

// === KDS — Misc ===
val QtyDark              = Color(0xFF06B6D4)
val QtyLight             = Color(0xFF0891B2)

val InfoDark             = Color(0xFF3B82F6)
val FiscalDark           = Color(0xFFA855F7)
val SupportDark          = Color(0xFF14B8A6)

val InfoLight            = Color(0xFF1D4ED8)
val FiscalLight          = Color(0xFF7C3AED)
val SupportLight         = Color(0xFF0F766E)

val BtnPrimaryTextDark  = Color(0xFFE8E8EC) // mesmo que TextPrimaryDark
val BtnPrimaryTextLight = Color(0xFFFFFFFF) // branco

// === Table status ===
val TableAvailable       = ReadyDark
val TableOccupied        = DangerDark
val TableReserved        = DeliveryDark