import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Non-intrusive banner that communicates offline / sync status to the user.
///
/// Does **not** block content — it slides in at the top of the screen and
/// takes up minimal vertical space.
///
/// Recommended usage is inside a [Column] above the screen body:
///
/// ```dart
/// Column(
///   children: [
///     if (!isOnline) const OfflineBanner(),
///     Expanded(child: _body),
///   ],
/// )
/// ```
///
/// Or use [OfflineBannerWrapper] to automatically show/hide with animation
/// based on a boolean connectivity flag.
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({
    super.key,
    this.message = 'Sin conexión — Modo offline activo',
    this.actionLabel,
    this.onAction,
  });

  /// Banner text. Override for custom messaging (e.g. "Sincronizando…").
  final String message;

  /// Optional action button label (e.g. "Reintentar").
  final String? actionLabel;

  /// Callback for the action button.
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFFFF3DC), // soft warning yellow (warning/10)
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          const Icon(Icons.wifi_off_rounded, size: 18, color: AppColors.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: AppTypography.label.copyWith(
                color: const Color(0xFF8A5700), // warm dark for contrast
                fontSize: 13,
              ),
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: AppTypography.label.copyWith(
                  color: const Color(0xFF8A5700),
                  fontSize: 13,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Wraps [child] and shows [OfflineBanner] at the top when [isOnline] is false.
///
/// The banner slides in and out smoothly with a [SizeTransition].
class OfflineBannerWrapper extends StatelessWidget {
  const OfflineBannerWrapper({
    super.key,
    required this.isOnline,
    required this.child,
    this.message = 'Sin conexión — Modo offline activo',
    this.actionLabel,
    this.onAction,
  });

  final bool isOnline;
  final Widget child;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          transitionBuilder: (child, animation) => SizeTransition(
            sizeFactor: animation,
            axis: Axis.vertical,
            child: child,
          ),
          child: isOnline
              ? const SizedBox.shrink(key: ValueKey('online'))
              : OfflineBanner(
                  key: const ValueKey('offline'),
                  message: message,
                  actionLabel: actionLabel,
                  onAction: onAction,
                ),
        ),
        Expanded(child: child),
      ],
    );
  }
}
