import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Sync state reported by the offline sync service.
enum SyncStatus {
  /// All local changes have been pushed to the server.
  synced,

  /// A sync operation is currently in progress.
  syncing,

  /// There are local changes waiting to be synced (shows count).
  pending,

  /// Last sync attempt failed.
  error,
}

/// Compact inline indicator for background sync state.
///
/// Use in app bars or headers to give users confidence their data is safe.
///
/// ```dart
/// SyncStatusIndicator(status: SyncStatus.pending, pendingCount: 3)
/// ```
class SyncStatusIndicator extends StatelessWidget {
  const SyncStatusIndicator({
    super.key,
    required this.status,
    this.pendingCount = 0,
    this.onTap,
  });

  final SyncStatus status;

  /// Number of pending records — shown only when [status] is [SyncStatus.pending].
  final int pendingCount;

  /// Optional tap to trigger manual sync or show detail.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildIcon(),
          const SizedBox(width: 4),
          Text(
            _label,
            style: AppTypography.caption.copyWith(
              color: _color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIcon() {
    return switch (status) {
      SyncStatus.synced => const Icon(
          Icons.check_circle_outline_rounded,
          size: 16,
          color: AppColors.success,
        ),
      SyncStatus.syncing => const SizedBox(
          width: 14,
          height: 14,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.primary,
          ),
        ),
      SyncStatus.pending => _PendingBadge(count: pendingCount),
      SyncStatus.error => const Icon(
          Icons.cancel_outlined,
          size: 16,
          color: AppColors.error,
        ),
    };
  }

  String get _label => switch (status) {
        SyncStatus.synced => 'Sincronizado',
        SyncStatus.syncing => 'Sincronizando…',
        SyncStatus.pending =>
          pendingCount > 0 ? '$pendingCount pendiente${pendingCount > 1 ? 's' : ''}' : 'Pendiente',
        SyncStatus.error => 'Error de sync',
      };

  Color get _color => switch (status) {
        SyncStatus.synced => AppColors.success,
        SyncStatus.syncing => AppColors.primary,
        SyncStatus.pending => AppColors.warning,
        SyncStatus.error => AppColors.error,
      };
}

class _PendingBadge extends StatelessWidget {
  const _PendingBadge({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 16,
      constraints: const BoxConstraints(minWidth: 16),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: AppColors.warning,
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        count > 99 ? '99+' : '$count',
        style: AppTypography.caption.copyWith(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          height: 1,
        ),
      ),
    );
  }
}

/// Larger pill variant suitable for a dedicated sync status row in settings
/// or the bottom of a list.
class SyncStatusPill extends StatelessWidget {
  const SyncStatusPill({
    super.key,
    required this.status,
    this.pendingCount = 0,
    this.onTap,
  });

  final SyncStatus status;
  final int pendingCount;
  final VoidCallback? onTap;

  Color get _bg => switch (status) {
        SyncStatus.synced => const Color(0xFFE6F4EA),
        SyncStatus.syncing => AppColors.primaryLight,
        SyncStatus.pending => const Color(0xFFFFF3DC),
        SyncStatus.error => const Color(0xFFFDE8EA),
      };

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: _bg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: SyncStatusIndicator(
          status: status,
          pendingCount: pendingCount,
        ),
      ),
    );
  }
}
