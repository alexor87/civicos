import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../viewmodels/volunteer_home_viewmodel.dart';

/// Pantalla de notificaciones del voluntario (últimas 48 h).
class VolunteerNotificationsScreen extends ConsumerWidget {
  const VolunteerNotificationsScreen({super.key});

  static const routePath = '/volunteer/notifications';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(volunteerHomeNotifierProvider);
    final notifier = ref.read(volunteerHomeNotifierProvider.notifier);
    final messages = state.messages;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Notificaciones'),
        actions: [
          TextButton(
            onPressed: () {
              // Marcar todos como leídos
              for (final m in messages.where((m) => !m.isRead)) {
                notifier.markMessageRead(m.id);
              }
            },
            child: Text(
              'Marcar todo',
              style: AppTypography.label.copyWith(color: AppColors.primary),
            ),
          ),
        ],
      ),
      body: messages.isEmpty
          ? _EmptyNotifications()
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 12),
              itemCount: messages.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, indent: 72, endIndent: 16),
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _NotificationTile(
                  message: msg,
                  onTap: () => notifier.markMessageRead(msg.id),
                );
              },
            ),
    );
  }
}

// ── Tile de notificación ──────────────────────────────────────────────────────

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.message,
    required this.onTap,
  });

  final CoordinatorMessage message;
  final VoidCallback onTap;

  String _timeAgo(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return 'Ahora mismo';
    if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
    return 'Hace ${diff.inDays} d';
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        color: message.isRead
            ? Colors.transparent
            : AppColors.primaryLight.withAlpha(80),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ícono
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: message.isRead
                        ? AppColors.surfaceVariant
                        : AppColors.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _iconForType(message),
                    size: 22,
                    color: message.isRead
                        ? AppColors.subtleText
                        : AppColors.primary,
                  ),
                ),
                if (!message.isRead)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                        border:
                            Border.fromBorderSide(BorderSide(
                          color: AppColors.surface,
                          width: 2,
                        )),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            // Contenido
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          message.title,
                          style: AppTypography.bodyVolunteer.copyWith(
                            fontWeight: message.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _timeAgo(message.sentAt),
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.body,
                    style: AppTypography.body.copyWith(
                      color: AppColors.subtleText,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconForType(CoordinatorMessage msg) {
    // Heurística simple por palabras clave en el título.
    final t = msg.title.toLowerCase();
    if (t.contains('asign') || t.contains('casa') || t.contains('zona')) {
      return Icons.assignment_outlined;
    }
    if (t.contains('rechazo') || t.contains('cancel')) {
      return Icons.cancel_outlined;
    }
    return Icons.campaign_outlined;
  }
}

// ── Estado vacío ──────────────────────────────────────────────────────────────

class _EmptyNotifications extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.notifications_none_outlined,
              size: 72,
              color: AppColors.border,
            ),
            const SizedBox(height: 20),
            Text(
              'Sin notificaciones\nen las últimas 48 horas',
              style: AppTypography.bodyVolunteer.copyWith(
                color: AppColors.subtleText,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
