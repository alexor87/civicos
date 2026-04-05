import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

// ── Button variant enum ────────────────────────────────────────────────────

/// Visual variant for [AppButton].
enum AppButtonVariant {
  /// Filled primary (default) — high emphasis actions.
  primary,

  /// Outlined / ghost — medium emphasis secondary actions.
  secondary,

  /// Filled danger / destructive — irreversible actions (delete, reject).
  danger,

  /// Outlined without fill — low-emphasis alternative.
  outline,
}

// ── AppButton (unified entry-point) ───────────────────────────────────────

/// Scrutix branded button with loading and disabled states.
///
/// All variants respect the 8 dp grid and meet the 48 dp minimum tap target
/// (WCAG 2.5.5). Pass [volunteer] to enlarge to 60 dp for outdoor one-hand use.
///
/// ```dart
/// AppButton(
///   label: 'Guardar',
///   onPressed: _save,
///   isLoading: _saving,
/// )
///
/// AppButton(
///   label: 'Eliminar',
///   variant: AppButtonVariant.danger,
///   onPressed: _delete,
/// )
/// ```
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.volunteer = false,
    this.expand = true,
  });

  /// Button label text.
  final String label;

  /// Tap callback. Pass `null` to disable the button.
  final VoidCallback? onPressed;

  /// Visual style variant.
  final AppButtonVariant variant;

  /// When `true` a [CircularProgressIndicator] replaces the label
  /// and the button is non-interactive.
  final bool isLoading;

  /// Optional leading icon displayed before the label.
  final IconData? icon;

  /// Enlarges the button to 60 dp height for volunteer / outdoor use.
  final bool volunteer;

  /// When `true` (default) the button expands to full available width.
  final bool expand;

  double get _minHeight => volunteer ? 60 : 48;
  Size get _minimumSize =>
      Size(expand ? double.infinity : 0, _minHeight);

  @override
  Widget build(BuildContext context) {
    return switch (variant) {
      AppButtonVariant.primary => _PrimaryButton(
          label: label,
          onPressed: isLoading ? null : onPressed,
          isLoading: isLoading,
          icon: icon,
          minimumSize: _minimumSize,
          minHeight: _minHeight,
        ),
      AppButtonVariant.secondary => _SecondaryButton(
          label: label,
          onPressed: isLoading ? null : onPressed,
          isLoading: isLoading,
          icon: icon,
          minimumSize: _minimumSize,
          minHeight: _minHeight,
        ),
      AppButtonVariant.danger => _DangerButton(
          label: label,
          onPressed: isLoading ? null : onPressed,
          isLoading: isLoading,
          icon: icon,
          minimumSize: _minimumSize,
          minHeight: _minHeight,
        ),
      AppButtonVariant.outline => _OutlineButton(
          label: label,
          onPressed: isLoading ? null : onPressed,
          isLoading: isLoading,
          icon: icon,
          minimumSize: _minimumSize,
          minHeight: _minHeight,
        ),
    };
  }
}

// ── Internal implementations ───────────────────────────────────────────────

class _ButtonContent extends StatelessWidget {
  const _ButtonContent({
    required this.label,
    required this.isLoading,
    required this.minHeight,
    this.icon,
    this.color = Colors.white,
  });

  final String label;
  final bool isLoading;
  final double minHeight;
  final IconData? icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation(color),
        ),
      );
    }
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Text(label),
        ],
      );
    }
    return Text(label);
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.onPressed,
    required this.isLoading,
    required this.minimumSize,
    required this.minHeight,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final Size minimumSize;
  final double minHeight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ElevatedButton(
      onPressed: onPressed,
      style: theme.elevatedButtonTheme.style?.copyWith(
        minimumSize: WidgetStatePropertyAll(minimumSize),
      ),
      child: _ButtonContent(
        label: label,
        isLoading: isLoading,
        minHeight: minHeight,
        icon: icon,
        color: Colors.white,
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  const _SecondaryButton({
    required this.label,
    required this.onPressed,
    required this.isLoading,
    required this.minimumSize,
    required this.minHeight,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final Size minimumSize;
  final double minHeight;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.surfaceVariant,
        foregroundColor: AppColors.primary,
        disabledBackgroundColor: AppColors.border,
        disabledForegroundColor: AppColors.subtleText,
        minimumSize: minimumSize,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
        textStyle: AppTypography.label
            .copyWith(fontSize: 15, fontWeight: FontWeight.w600),
      ),
      child: _ButtonContent(
        label: label,
        isLoading: isLoading,
        minHeight: minHeight,
        icon: icon,
        color: AppColors.primary,
      ),
    );
  }
}

class _DangerButton extends StatelessWidget {
  const _DangerButton({
    required this.label,
    required this.onPressed,
    required this.isLoading,
    required this.minimumSize,
    required this.minHeight,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final Size minimumSize;
  final double minHeight;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.error,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.border,
        disabledForegroundColor: AppColors.subtleText,
        minimumSize: minimumSize,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
        textStyle: AppTypography.label
            .copyWith(fontSize: 15, fontWeight: FontWeight.w600),
      ),
      child: _ButtonContent(
        label: label,
        isLoading: isLoading,
        minHeight: minHeight,
        icon: icon,
        color: Colors.white,
      ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  const _OutlineButton({
    required this.label,
    required this.onPressed,
    required this.isLoading,
    required this.minimumSize,
    required this.minHeight,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final Size minimumSize;
  final double minHeight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return OutlinedButton(
      onPressed: onPressed,
      style: theme.outlinedButtonTheme.style?.copyWith(
        minimumSize: WidgetStatePropertyAll(minimumSize),
      ),
      child: _ButtonContent(
        label: label,
        isLoading: isLoading,
        minHeight: minHeight,
        icon: icon,
        color: AppColors.primary,
      ),
    );
  }
}

// ── Convenience constructors (tree-shaking-safe named constructors) ────────

/// Shortcut for [AppButton] with [AppButtonVariant.primary].
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.volunteer = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool volunteer;

  @override
  Widget build(BuildContext context) => AppButton(
        label: label,
        onPressed: onPressed,
        isLoading: isLoading,
        icon: icon,
        volunteer: volunteer,
      );
}

/// Shortcut for [AppButton] with [AppButtonVariant.secondary].
class SecondaryButton extends StatelessWidget {
  const SecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.volunteer = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool volunteer;

  @override
  Widget build(BuildContext context) => AppButton(
        label: label,
        onPressed: onPressed,
        isLoading: isLoading,
        icon: icon,
        variant: AppButtonVariant.secondary,
        volunteer: volunteer,
      );
}

/// Shortcut for [AppButton] with [AppButtonVariant.danger].
class DangerButton extends StatelessWidget {
  const DangerButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.volunteer = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool volunteer;

  @override
  Widget build(BuildContext context) => AppButton(
        label: label,
        onPressed: onPressed,
        isLoading: isLoading,
        icon: icon,
        variant: AppButtonVariant.danger,
        volunteer: volunteer,
      );
}

/// Shortcut for [AppButton] with [AppButtonVariant.outline].
class OutlineButton extends StatelessWidget {
  const OutlineButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.volunteer = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool volunteer;

  @override
  Widget build(BuildContext context) => AppButton(
        label: label,
        onPressed: onPressed,
        isLoading: isLoading,
        icon: icon,
        variant: AppButtonVariant.outline,
        volunteer: volunteer,
      );
}
