import 'package:flutter/material.dart';

/// CivicOS color palette — single source of truth.
///
/// All values are compile-time constants; use them directly in widgets
/// or reference them from [AppTheme] / [RoleThemes].
abstract final class AppColors {
  // ── Primary ────────────────────────────────────────────────────────────────
  static const primary = Color(0xFF2262EC);
  static const primaryDark = Color(0xFF1A4FBF);
  static const primaryLight = Color(0xFFEEF2FD);

  // ── Field / WhatsApp green ─────────────────────────────────────────────────
  static const fieldGreen = Color(0xFF25D366);
  static const fieldGreenLight = Color(0xFFEBFAF1);

  // ── Surface / Background ───────────────────────────────────────────────────
  static const surface = Color(0xFFFFFFFF);
  static const background = Color(0xFFF6F7F8);

  /// Slightly tinted surface used for hover states and alternate rows.
  static const surfaceVariant = Color(0xFFF0F2F5);

  // ── Text ───────────────────────────────────────────────────────────────────
  static const onSurface = Color(0xFF1B1F23);
  static const subtleText = Color(0xFF6A737D);
  static const placeholderText = Color(0xFFB1BAC5);

  // ── Border ─────────────────────────────────────────────────────────────────
  static const border = Color(0xFFDCDEE6);

  /// Border color used when a field is focused.
  static const borderFocus = Color(0xFF2262EC);

  // ── Status ─────────────────────────────────────────────────────────────────
  static const error = Color(0xFFD73A49);
  static const success = Color(0xFF28A745);
  static const warning = Color(0xFFF6A623);
  static const info = Color(0xFF0366D6);

  // ── Semantic field colors ──────────────────────────────────────────────────
  /// Simpatizante / supporter
  static const supporter = Color(0xFF28A745);

  /// Oponente / opponent
  static const opponent = Color(0xFFD73A49);

  /// Indeciso / undecided
  static const undecided = Color(0xFFF6A623);

  /// No estaba en casa / not home
  static const notHome = Color(0xFF6A737D);
}
