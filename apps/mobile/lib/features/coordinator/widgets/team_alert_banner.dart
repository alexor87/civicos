import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../viewmodels/team_viewmodel.dart';

/// Banner expandible/colapsable con alertas del equipo.
class TeamAlertBanner extends StatelessWidget {
  const TeamAlertBanner({
    super.key,
    required this.alerts,
    required this.isExpanded,
    required this.onToggle,
    required this.onAlertTap,
    required this.onDismiss,
  });

  final List<TeamAlert> alerts;
  final bool isExpanded;
  final VoidCallback onToggle;
  final void Function(TeamAlert alert) onAlertTap;
  final void Function(String alertId) onDismiss;

  @override
  Widget build(BuildContext context) {
    if (alerts.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8EC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          // Header con toggle
          InkWell(
            onTap: onToggle,
            borderRadius: isExpanded
                ? const BorderRadius.vertical(top: Radius.circular(12))
                : BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${alerts.length} alerta${alerts.length == 1 ? '' : 's'} del equipo',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF8A5700),
                      ),
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: AppColors.warning,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
          // Cuerpo expandible
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            child: isExpanded
                ? Column(
                    children: [
                      Container(height: 1, color: AppColors.warning.withValues(alpha: 0.2)),
                      ...alerts.map((alert) => _AlertRow(
                            alert: alert,
                            onTap: () => onAlertTap(alert),
                            onDismiss: () => onDismiss(alert.id),
                          )),
                    ],
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _AlertRow extends StatelessWidget {
  const _AlertRow({
    required this.alert,
    required this.onTap,
    required this.onDismiss,
  });

  final TeamAlert alert;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            _alertIcon(alert.type),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                alert.message,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B4200),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, size: 16, color: AppColors.warning),
            GestureDetector(
              onTap: onDismiss,
              child: const Padding(
                padding: EdgeInsets.only(left: 4),
                child: Icon(Icons.close, size: 15, color: AppColors.subtleText),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _alertIcon(AlertType type) {
    final (icon, color) = switch (type) {
      AlertType.inactiveVolunteer => (Icons.person_off_outlined, AppColors.warning),
      AlertType.riskZone => (Icons.location_off_outlined, AppColors.error),
      AlertType.rejectedRecord => (Icons.cancel_outlined, AppColors.error),
    };
    return Icon(icon, size: 18, color: color);
  }
}
