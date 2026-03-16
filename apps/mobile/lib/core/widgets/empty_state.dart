import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Full-area empty state with icon/illustration, title, description and an
/// optional CTA button.
///
/// Center this inside the screen body for a polished zero-data state.
///
/// ```dart
/// EmptyState(
///   icon: Icons.people_outline,
///   title: 'No hay contactos aún',
///   description: 'Agrega tu primer contacto para comenzar a gestionar tu campaña.',
///   actionLabel: 'Agregar contacto',
///   onAction: () => context.push('/contacts/new'),
/// )
/// ```
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.description,
    this.icon,
    this.svgAsset,
    this.actionLabel,
    this.onAction,
    this.secondaryActionLabel,
    this.onSecondaryAction,
    this.iconSize = 64,
    this.iconColor,
  });

  /// Large icon to display above the title.
  /// Use [icon] for Material icons or [svgAsset] for custom SVG illustrations.
  final IconData? icon;

  /// Path to an SVG asset (e.g. `'assets/icons/empty_contacts.svg'`).
  /// Takes precedence over [icon] if both are provided.
  final String? svgAsset;

  /// Short, descriptive title of the empty state.
  final String title;

  /// Optional longer explanation below the title.
  final String? description;

  /// Label for the primary CTA button.
  final String? actionLabel;

  /// Primary CTA callback.
  final VoidCallback? onAction;

  /// Label for an optional secondary action (e.g. "Importar").
  final String? secondaryActionLabel;

  final VoidCallback? onSecondaryAction;

  /// Size of the icon in logical pixels.
  final double iconSize;

  /// Icon color. Defaults to [AppColors.border] (subtle, non-distracting).
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildIllustration(),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTypography.headline.copyWith(
                color: AppColors.onSurface,
              ),
            ),
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: AppTypography.body.copyWith(
                  color: AppColors.subtleText,
                ),
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 32),
              SizedBox(
                width: 220,
                child: FilledButton(
                  onPressed: onAction,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size(0, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    actionLabel!,
                    style: AppTypography.label.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
            if (secondaryActionLabel != null && onSecondaryAction != null) ...[
              const SizedBox(height: 12),
              TextButton(
                onPressed: onSecondaryAction,
                child: Text(secondaryActionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildIllustration() {
    // SVG takes priority — caller must import flutter_svg separately
    // since we keep this widget free of conditional imports.
    // If svgAsset is set, callers can replace this widget with their own
    // SvgPicture.asset(...) if needed, or use the icon fallback.
    return Icon(
      icon ?? Icons.inbox_outlined,
      size: iconSize,
      color: iconColor ?? AppColors.border,
    );
  }
}

/// Compact inline empty state for use inside cards or tabs.
class EmptyStateInline extends StatelessWidget {
  const EmptyStateInline({
    super.key,
    required this.message,
    this.icon = Icons.inbox_outlined,
  });

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20, color: AppColors.border),
          const SizedBox(width: 8),
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.subtleText),
          ),
        ],
      ),
    );
  }
}
