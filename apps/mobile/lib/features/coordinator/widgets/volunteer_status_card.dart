import 'package:flutter/material.dart';

import '../../../core/models/volunteer_summary.dart';
import '../../../core/theme/app_colors.dart';

/// Card de voluntario con estado de actividad y barra de progreso de visitas.
class VolunteerStatusCard extends StatelessWidget {
  const VolunteerStatusCard({
    super.key,
    required this.volunteer,
    required this.onTap,
  });

  final VolunteerSummary volunteer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _Avatar(
                  name: volunteer.fullName,
                  avatarUrl: volunteer.avatarUrl,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              volunteer.fullName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.onSurface,
                              ),
                            ),
                          ),
                          _StatusChip(status: volunteer.activityStatus),
                        ],
                      ),
                      if (volunteer.territoryName != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          volunteer.territoryName!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.subtleText,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${volunteer.visitsCompleted} / ${volunteer.visitsAssigned} visitas',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.subtleText,
                            ),
                          ),
                          Text(
                            '${volunteer.progressPercent.toStringAsFixed(0)}%',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurface,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: volunteer.progressPercent / 100,
                        backgroundColor: AppColors.border,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(_progressColor(volunteer.progressPercent)),
                        minHeight: 5,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (volunteer.lastActivityAt != null) ...[
              const SizedBox(height: 6),
              Text(
                'Último registro hace ${_timeAgo(volunteer.lastActivityAt!)}',
                style: const TextStyle(fontSize: 11, color: AppColors.subtleText),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _progressColor(double percent) {
    if (percent >= 80) return AppColors.success;
    if (percent >= 50) return AppColors.warning;
    return AppColors.error;
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes} min';
    if (diff.inHours < 24) return '${diff.inHours} h';
    return '${diff.inDays} d';
  }
}

// ── Avatar ────────────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  const _Avatar({required this.name, this.avatarUrl});

  final String name;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 22,
        backgroundImage: NetworkImage(avatarUrl!),
      );
    }
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return CircleAvatar(
      radius: 22,
      backgroundColor: AppColors.primaryLight,
      child: Text(
        initial,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontSize: 16,
        ),
      ),
    );
  }
}

// ── StatusChip ────────────────────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color, bgColor) = switch (status) {
      'active' => ('Activo', AppColors.success, const Color(0xFFEBFAF1)),
      'inactive' => ('Sin actividad', AppColors.warning, const Color(0xFFFFF8EC)),
      _ => ('Offline', AppColors.subtleText, AppColors.surfaceVariant),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Volunteer Detail Bottom Sheet ─────────────────────────────────────────────

class VolunteerDetailSheet extends StatelessWidget {
  const VolunteerDetailSheet({
    super.key,
    required this.volunteer,
    required this.onSendMessage,
    required this.onReassignTerritory,
  });

  final VolunteerSummary volunteer;
  final VoidCallback onSendMessage;
  final VoidCallback onReassignTerritory;

  static Future<void> show(
    BuildContext context, {
    required VolunteerSummary volunteer,
    required VoidCallback onSendMessage,
    required VoidCallback onReassignTerritory,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VolunteerDetailSheet(
        volunteer: volunteer,
        onSendMessage: onSendMessage,
        onReassignTerritory: onReassignTerritory,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final recentVisits = _buildMockVisits();

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                _Avatar(name: volunteer.fullName, avatarUrl: volunteer.avatarUrl),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        volunteer.fullName,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                      if (volunteer.territoryName != null)
                        Text(
                          volunteer.territoryName!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.subtleText,
                          ),
                        ),
                    ],
                  ),
                ),
                _StatusChip(status: volunteer.activityStatus),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: AppColors.border),
          // Últimas visitas
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Últimas visitas',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.subtleText,
                ),
              ),
            ),
          ),
          ...recentVisits.map((v) => _VisitRow(visit: v)),
          const SizedBox(height: 16),
          // Botones
          Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              0,
              20,
              MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      onSendMessage();
                    },
                    icon: const Icon(Icons.message_outlined, size: 16),
                    label: const Text('Enviar mensaje'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      onReassignTerritory();
                    },
                    icon: const Icon(Icons.map_outlined, size: 16),
                    label: const Text('Reasignar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<_MockVisit> _buildMockVisits() {
    return [
      _MockVisit('Roberto Gómez', 'Contactado', AppColors.success, '14:32'),
      _MockVisit('Sandra López', 'No estaba', AppColors.subtleText, '13:15'),
      _MockVisit('Pedro Vargas', 'Rechazó', AppColors.error, '12:48'),
      _MockVisit('Gloria Estrada', 'Contactada', AppColors.success, '11:20'),
      _MockVisit('Tomás Herrera', 'No estaba', AppColors.subtleText, '10:05'),
    ];
  }
}

class _MockVisit {
  const _MockVisit(this.name, this.result, this.color, this.time);
  final String name;
  final String result;
  final Color color;
  final String time;
}

class _VisitRow extends StatelessWidget {
  const _VisitRow({required this.visit});
  final _MockVisit visit;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: visit.color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              visit.name,
              style: const TextStyle(fontSize: 14, color: AppColors.onSurface),
            ),
          ),
          Text(
            visit.result,
            style: TextStyle(fontSize: 13, color: visit.color, fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 12),
          Text(
            visit.time,
            style: const TextStyle(fontSize: 12, color: AppColors.subtleText),
          ),
        ],
      ),
    );
  }
}
