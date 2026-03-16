import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_theme.dart';
import 'app_typography.dart';

/// Role-specific [ThemeData] extensions for CivicOS.
///
/// Each campaign role has unique ergonomic requirements:
/// - **Volunteer** — used outdoors, one-handed, often under direct sunlight.
///   Larger touch targets (60 dp), bigger body text (17 sp), maximum contrast.
/// - **Field Coordinator** — needs information density while remaining
///   legible under sun. Standard text scale, compact layout.
///
/// Usage:
/// ```dart
/// // In a widget that knows the current user role:
/// final theme = role == UserRole.volunteer
///     ? RoleThemes.volunteer
///     : RoleThemes.coordinator;
///
/// return Theme(data: theme, child: child);
/// ```
abstract final class RoleThemes {
  // ── Volunteer ─────────────────────────────────────────────────────────────

  /// High-visibility theme for door-to-door volunteers.
  ///
  /// Key differences from [AppTheme.light]:
  /// - Body font bumped to 17 sp for outdoor readability
  /// - Button minimum height 60 dp (single large thumb tap)
  /// - Extra-light scaffold background for maximum brightness outdoors
  /// - Chip padding enlarged for gloved / large finger use
  static ThemeData get volunteer => AppTheme.light.copyWith(
        scaffoldBackgroundColor: AppColors.surface, // pure white — max contrast

        textTheme: AppTypography.volunteerTextTheme,

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            disabledBackgroundColor: AppColors.border,
            disabledForegroundColor: AppColors.subtleText,
            // 60 dp height instead of standard 48 dp
            minimumSize: const Size(double.infinity, 60),
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
            textStyle: AppTypography.bodyMedium.copyWith(
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),

        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            minimumSize: const Size(double.infinity, 60),
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            side: const BorderSide(color: AppColors.primary, width: 2),
            textStyle: AppTypography.bodyMedium.copyWith(
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),

        // Larger list tiles for easier tap targets
        listTileTheme: ListTileThemeData(
          minVerticalPadding: 16,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          titleTextStyle: AppTypography.bodyVolunteer,
          subtitleTextStyle:
              AppTypography.body.copyWith(color: AppColors.subtleText),
          iconColor: AppColors.subtleText,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),

        chipTheme: ChipThemeData(
          backgroundColor: AppColors.surfaceVariant,
          selectedColor: AppColors.primaryLight,
          labelStyle: AppTypography.label.copyWith(fontSize: 15),
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          // Extra horizontal padding for larger tap target
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        ),

        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surface,
          // Taller input for easier tap
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide:
                const BorderSide(color: AppColors.borderFocus, width: 2.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide:
                const BorderSide(color: AppColors.error, width: 1.5),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.error, width: 2.5),
          ),
          labelStyle: AppTypography.bodyVolunteer
              .copyWith(color: AppColors.subtleText, fontSize: 15),
          hintStyle: AppTypography.bodyVolunteer
              .copyWith(color: AppColors.placeholderText),
        ),
      );

  // ── Field Coordinator ─────────────────────────────────────────────────────

  /// Information-dense theme for coordinators managing volunteers on the field.
  ///
  /// Key differences from [AppTheme.light]:
  /// - Standard text scale (no bumps) to fit more data on screen
  /// - Slightly reduced list tile padding to increase information density
  /// - Same touch target minimums (48 dp) — coordinators typically not
  ///   entering data while physically moving
  static ThemeData get coordinator => AppTheme.light.copyWith(
        // Dense list tiles — more rows visible at once
        listTileTheme: ListTileThemeData(
          minVerticalPadding: 8,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          titleTextStyle: AppTypography.body,
          subtitleTextStyle:
              AppTypography.caption.copyWith(color: AppColors.subtleText),
          iconColor: AppColors.subtleText,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),

        // Compact chip — more chips visible in filter bars
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.surfaceVariant,
          selectedColor: AppColors.primaryLight,
          labelStyle: AppTypography.label,
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        ),
      );
}
