import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// CivicOS card with standard 16 dp padding, rounded-12 border, and
/// a subtle 1 dp border instead of a shadow — keeps the UI flat and
/// legible on any background.
///
/// ```dart
/// AppCard(
///   child: Column(
///     crossAxisAlignment: CrossAxisAlignment.start,
///     children: [
///       Text('Card title', style: AppTypography.headline),
///       const SizedBox(height: 8),
///       Text('Card body copy goes here.'),
///     ],
///   ),
/// )
/// ```
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.color,
    this.borderColor,
    this.borderRadius,
    this.onTap,
    this.margin,
  });

  /// Card body.
  final Widget child;

  /// Inner padding. Defaults to `EdgeInsets.all(16)` (8 dp grid × 2).
  final EdgeInsetsGeometry? padding;

  /// Card background. Defaults to [AppColors.surface].
  final Color? color;

  /// Border color. Defaults to [AppColors.border].
  final Color? borderColor;

  /// Corner radius. Defaults to 12.
  final double? borderRadius;

  /// Optional tap handler. Adds an [InkWell] ripple when provided.
  final VoidCallback? onTap;

  /// Outer margin. Defaults to [EdgeInsets.zero].
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? 12.0;
    final card = Container(
      margin: margin ?? EdgeInsets.zero,
      decoration: BoxDecoration(
        color: color ?? AppColors.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: borderColor ?? AppColors.border,
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: onTap != null
            ? InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(radius),
                child: Padding(
                  padding: padding ?? const EdgeInsets.all(16),
                  child: child,
                ),
              )
            : Padding(
                padding: padding ?? const EdgeInsets.all(16),
                child: child,
              ),
      ),
    );
    return card;
  }
}

/// Compact variant of [AppCard] with 12 dp padding — useful inside lists.
class AppCardCompact extends StatelessWidget {
  const AppCardCompact({
    super.key,
    required this.child,
    this.color,
    this.borderColor,
    this.onTap,
  });

  final Widget child;
  final Color? color;
  final Color? borderColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => AppCard(
        padding: const EdgeInsets.all(12),
        color: color,
        borderColor: borderColor,
        onTap: onTap,
        child: child,
      );
}
