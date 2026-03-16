import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Predefined avatar sizes following the 8 dp grid.
enum AvatarSize {
  /// 24 × 24 dp — inline / chip use
  xs,

  /// 32 × 32 dp — list subtitles, compact rows
  sm,

  /// 40 × 40 dp — standard list leading, default size
  md,

  /// 56 × 56 dp — profile headers, prominent placements
  lg,
}

extension _AvatarSizeValue on AvatarSize {
  double get dp => switch (this) {
        AvatarSize.xs => 24,
        AvatarSize.sm => 32,
        AvatarSize.md => 40,
        AvatarSize.lg => 56,
      };

  double get fontSize => switch (this) {
        AvatarSize.xs => 10,
        AvatarSize.sm => 13,
        AvatarSize.md => 16,
        AvatarSize.lg => 22,
      };
}

/// Circular avatar showing either a remote photo or a colored initial letter.
///
/// Automatically falls back to the initial if the [photoUrl] is null or fails
/// to load.
///
/// ```dart
/// AvatarWidget(name: 'María García')            // shows "M"
/// AvatarWidget(name: 'María', photoUrl: url)   // shows photo with "M" fallback
/// AvatarWidget(name: 'Carlos', size: AvatarSize.lg) // 56 dp
/// ```
class AvatarWidget extends StatelessWidget {
  const AvatarWidget({
    super.key,
    required this.name,
    this.photoUrl,
    this.size = AvatarSize.md,
    this.backgroundColor,
    this.foregroundColor,
  });

  /// Display name — used to derive the initial letter.
  final String name;

  /// Remote image URL. Falls back to initial if null or load fails.
  final String? photoUrl;

  final AvatarSize size;

  /// Background color for the initial avatar. Defaults to a deterministic
  /// color derived from [name] to ensure consistency across sessions.
  final Color? backgroundColor;

  /// Initial text color. Defaults to white.
  final Color? foregroundColor;

  String get _initial =>
      name.isNotEmpty ? name.trim()[0].toUpperCase() : '?';

  /// Derive a consistent background color from the name string.
  Color get _derivedBg {
    if (backgroundColor != null) return backgroundColor!;
    const palette = [
      AppColors.primary,
      Color(0xFF7B2D8B),
      Color(0xFFD73A49),
      Color(0xFFF6A623),
      Color(0xFF28A745),
      Color(0xFF0366D6),
      Color(0xFF6F42C1),
    ];
    final index = name.codeUnits.fold(0, (a, b) => a + b) % palette.length;
    return palette[index];
  }

  @override
  Widget build(BuildContext context) {
    final dp = size.dp;

    final initial = _buildInitial(dp);

    if (photoUrl == null || photoUrl!.isEmpty) return initial;

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: photoUrl!,
        width: dp,
        height: dp,
        fit: BoxFit.cover,
        placeholder: (_, __) => initial,
        errorWidget: (_, __, ___) => initial,
      ),
    );
  }

  Widget _buildInitial(double dp) => Container(
        width: dp,
        height: dp,
        decoration: BoxDecoration(
          color: _derivedBg,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Text(
          _initial,
          style: AppTypography.label.copyWith(
            fontSize: size.fontSize,
            fontWeight: FontWeight.w700,
            color: foregroundColor ?? Colors.white,
            height: 1,
          ),
        ),
      );
}
