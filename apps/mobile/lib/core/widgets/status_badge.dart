import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Semantic status of a document / record, used to color the badge.
enum BadgeStatus {
  /// Item is saved but not yet sent.
  draft,

  /// Item has been submitted / sent.
  sent,

  /// Item has been reviewed and approved.
  approved,

  /// Item has been reviewed and rejected.
  rejected,

  /// Item is being processed.
  pending,

  /// Action completed successfully.
  success,

  /// Action resulted in an error.
  error,

  /// Neutral / informational state.
  neutral,

  /// Item is active / live.
  active,

  /// Item has been cancelled.
  cancelled,
}

/// Small pill badge that communicates a semantic status using color and label.
///
/// Meets WCAG AA contrast on [AppColors.surface] and [AppColors.background].
///
/// ```dart
/// StatusBadge(status: BadgeStatus.approved, label: 'Aprobado')
/// StatusBadge.fromStatus(BadgeStatus.pending) // uses default label
/// ```
class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.status,
    required this.label,
  });

  /// Derives label from [status] using the Spanish default labels map.
  factory StatusBadge.fromStatus(BadgeStatus status) => StatusBadge(
        status: status,
        label: _defaultLabels[status] ?? status.name,
      );

  final BadgeStatus status;

  /// Text displayed inside the badge.
  final String label;

  static const _defaultLabels = <BadgeStatus, String>{
    BadgeStatus.draft: 'Borrador',
    BadgeStatus.sent: 'Enviado',
    BadgeStatus.approved: 'Aprobado',
    BadgeStatus.rejected: 'Rechazado',
    BadgeStatus.pending: 'Pendiente',
    BadgeStatus.success: 'Exitoso',
    BadgeStatus.error: 'Error',
    BadgeStatus.neutral: 'Neutral',
    BadgeStatus.active: 'Activo',
    BadgeStatus.cancelled: 'Cancelado',
  };

  _BadgeColors get _colors => switch (status) {
        BadgeStatus.approved ||
        BadgeStatus.success ||
        BadgeStatus.active =>
          const _BadgeColors(
            background: Color(0xFFE6F4EA),
            foreground: Color(0xFF1A6E30),
          ),
        BadgeStatus.rejected ||
        BadgeStatus.error =>
          const _BadgeColors(
            background: Color(0xFFFDE8EA),
            foreground: Color(0xFF7A1020),
          ),
        BadgeStatus.pending ||
        BadgeStatus.sent =>
          const _BadgeColors(
            background: Color(0xFFFFF3DC),
            foreground: Color(0xFF8A5700),
          ),
        BadgeStatus.draft ||
        BadgeStatus.neutral ||
        BadgeStatus.cancelled =>
          const _BadgeColors(
            background: AppColors.surfaceVariant,
            foreground: AppColors.subtleText,
          ),
      };

  @override
  Widget build(BuildContext context) {
    final colors = _colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: AppTypography.caption.copyWith(
          color: colors.foreground,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _BadgeColors {
  const _BadgeColors({required this.background, required this.foreground});
  final Color background;
  final Color foreground;
}

// ── Voter disposition badge (semantic field colors) ────────────────────────

/// Badge variant for voter disposition: supporter, opponent, undecided, notHome.
enum VoterDisposition { supporter, opponent, undecided, notHome }

/// Badge for canvassing voter disposition — uses semantic field colors.
class VoterDispositionBadge extends StatelessWidget {
  const VoterDispositionBadge({
    super.key,
    required this.disposition,
  });

  final VoterDisposition disposition;

  static const _labels = <VoterDisposition, String>{
    VoterDisposition.supporter: 'Simpatizante',
    VoterDisposition.opponent: 'Oponente',
    VoterDisposition.undecided: 'Indeciso',
    VoterDisposition.notHome: 'No estaba',
  };

  static const _colors = <VoterDisposition, _BadgeColors>{
    VoterDisposition.supporter: _BadgeColors(
      background: Color(0xFFE6F4EA),
      foreground: AppColors.supporter,
    ),
    VoterDisposition.opponent: _BadgeColors(
      background: Color(0xFFFDE8EA),
      foreground: AppColors.opponent,
    ),
    VoterDisposition.undecided: _BadgeColors(
      background: Color(0xFFFFF3DC),
      foreground: AppColors.undecided,
    ),
    VoterDisposition.notHome: _BadgeColors(
      background: AppColors.surfaceVariant,
      foreground: AppColors.notHome,
    ),
  };

  @override
  Widget build(BuildContext context) {
    final colors = _colors[disposition]!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        _labels[disposition]!,
        style: AppTypography.caption.copyWith(
          color: colors.foreground,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
