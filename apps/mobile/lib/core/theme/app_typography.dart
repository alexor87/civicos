import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Scrutix typographic scale built on Inter (Google Fonts).
///
/// Use these static [TextStyle] constants directly in widgets or reference
/// them through [AppTheme.light.textTheme].
abstract final class AppTypography {
  // ── Base font family ───────────────────────────────────────────────────────

  /// Returns an Inter [TextStyle] merged with [base].
  static TextStyle _inter(TextStyle base) => GoogleFonts.inter(textStyle: base);

  // ── Scale ──────────────────────────────────────────────────────────────────

  /// 28 sp · bold — hero headers, splash screens
  static final display = _inter(
    const TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w700,
      height: 1.25,
      color: AppColors.onSurface,
    ),
  );

  /// 22 sp · semibold — screen titles, dialog titles
  static final title = _inter(
    const TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w600,
      height: 1.3,
      color: AppColors.onSurface,
    ),
  );

  /// 18 sp · semibold — section headers, card titles
  static final headline = _inter(
    const TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      height: 1.35,
      color: AppColors.onSurface,
    ),
  );

  /// 15 sp · regular — default body copy
  static final body = _inter(
    const TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w400,
      height: 1.5,
      color: AppColors.onSurface,
    ),
  );

  /// 15 sp · medium — body copy that needs emphasis
  static final bodyMedium = _inter(
    const TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w500,
      height: 1.5,
      color: AppColors.onSurface,
    ),
  );

  /// 13 sp · medium — labels, form field labels, chips
  static final label = _inter(
    const TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w500,
      height: 1.4,
      color: AppColors.onSurface,
    ),
  );

  /// 11 sp · regular — secondary info, timestamps
  static final caption = _inter(
    const TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w400,
      height: 1.4,
      color: AppColors.subtleText,
    ),
  );

  // ── Volunteer variant — larger for outdoor one-hand use ───────────────────

  /// 17 sp · regular — volunteer role body text (larger for outdoor use)
  static final bodyVolunteer = _inter(
    const TextStyle(
      fontSize: 17,
      fontWeight: FontWeight.w400,
      height: 1.55,
      color: AppColors.onSurface,
    ),
  );

  /// 19 sp · semibold — volunteer role headline
  static final headlineVolunteer = _inter(
    const TextStyle(
      fontSize: 19,
      fontWeight: FontWeight.w600,
      height: 1.35,
      color: AppColors.onSurface,
    ),
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Builds a complete [TextTheme] from the Scrutix scale.
  /// Used by [AppTheme] so the scale is available via [Theme.of(context).textTheme].
  static TextTheme get textTheme => TextTheme(
        displayLarge: display,
        displayMedium: display.copyWith(fontSize: 26),
        displaySmall: display.copyWith(fontSize: 24),
        headlineLarge: title,
        headlineMedium: headline,
        headlineSmall: headline.copyWith(fontSize: 16),
        titleLarge: title.copyWith(fontSize: 20),
        titleMedium: bodyMedium.copyWith(fontSize: 16),
        titleSmall: label.copyWith(fontSize: 14),
        bodyLarge: body.copyWith(fontSize: 16),
        bodyMedium: body,
        bodySmall: body.copyWith(fontSize: 13),
        labelLarge: label.copyWith(fontSize: 14),
        labelMedium: label,
        labelSmall: caption,
      );

  /// Volunteer-sized [TextTheme] — bump body/label up for outdoor readability.
  static TextTheme get volunteerTextTheme => textTheme.copyWith(
        bodyLarge: bodyVolunteer.copyWith(fontSize: 18),
        bodyMedium: bodyVolunteer,
        headlineMedium: headlineVolunteer,
      );
}
