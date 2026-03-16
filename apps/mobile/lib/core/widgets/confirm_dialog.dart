import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Reusable confirmation [AlertDialog] for irreversible or important actions.
///
/// Returns `true` when the user confirms and `false` (or `null` on dismiss)
/// when they cancel.
///
/// ```dart
/// final confirmed = await ConfirmDialog.show(
///   context,
///   title: '¿Eliminar contacto?',
///   message: 'Esta acción no se puede deshacer.',
///   confirmLabel: 'Eliminar',
///   isDangerous: true,
/// );
/// if (confirmed == true) _deleteContact();
/// ```
class ConfirmDialog extends StatelessWidget {
  const ConfirmDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmLabel = 'Confirmar',
    this.cancelLabel = 'Cancelar',
    this.isDangerous = false,
    this.icon,
  });

  /// Dialog title — short and action-oriented (e.g. "¿Eliminar contacto?").
  final String title;

  /// Explanatory body text. Should explain consequences clearly.
  final String message;

  /// Label for the confirm button. Default: "Confirmar".
  final String confirmLabel;

  /// Label for the cancel button. Default: "Cancelar".
  final String cancelLabel;

  /// When `true` the confirm button uses [AppColors.error] (destructive action).
  final bool isDangerous;

  /// Optional icon shown above the title for extra visual weight.
  final IconData? icon;

  // ── Static convenience method ────────────────────────────────────────────

  /// Shows the dialog and returns `true` if confirmed, `false`/`null` if not.
  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'Confirmar',
    String cancelLabel = 'Cancelar',
    bool isDangerous = false,
    IconData? icon,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (_) => ConfirmDialog(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        isDangerous: isDangerous,
        icon: icon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
      actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      icon: icon != null
          ? Icon(
              icon,
              size: 36,
              color: isDangerous ? AppColors.error : AppColors.primary,
            )
          : null,
      title: Text(
        title,
        textAlign: TextAlign.center,
        style: AppTypography.title.copyWith(fontSize: 18),
      ),
      content: Text(
        message,
        textAlign: TextAlign.center,
        style: AppTypography.body.copyWith(color: AppColors.subtleText),
      ),
      actions: [
        // Cancel — text button, dismisses dialog with false
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(false),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 48),
              side: const BorderSide(color: AppColors.border),
              foregroundColor: AppColors.onSurface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              cancelLabel,
              style: AppTypography.label.copyWith(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.onSurface,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        // Confirm — filled button, returns true
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor:
                  isDangerous ? AppColors.error : AppColors.primary,
              minimumSize: const Size(0, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              confirmLabel,
              style: AppTypography.label.copyWith(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Lightweight info dialog with a single "Entendido" dismiss button.
class InfoDialog extends StatelessWidget {
  const InfoDialog({
    super.key,
    required this.title,
    required this.message,
    this.dismissLabel = 'Entendido',
    this.icon,
  });

  final String title;
  final String message;
  final String dismissLabel;
  final IconData? icon;

  static Future<void> show(
    BuildContext context, {
    required String title,
    required String message,
    String dismissLabel = 'Entendido',
    IconData? icon,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => InfoDialog(
        title: title,
        message: message,
        dismissLabel: dismissLabel,
        icon: icon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
      actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      icon: icon != null
          ? Icon(icon, size: 36, color: AppColors.primary)
          : null,
      title: Text(
        title,
        textAlign: TextAlign.center,
        style: AppTypography.title.copyWith(fontSize: 18),
      ),
      content: Text(
        message,
        textAlign: TextAlign.center,
        style: AppTypography.body.copyWith(color: AppColors.subtleText),
      ),
      actions: [
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size(0, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              dismissLabel,
              style: AppTypography.label.copyWith(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
