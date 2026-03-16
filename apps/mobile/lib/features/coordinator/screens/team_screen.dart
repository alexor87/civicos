import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../viewmodels/team_viewmodel.dart';
import '../widgets/team_alert_banner.dart';
import '../widgets/volunteer_status_card.dart';

/// Dashboard del equipo de voluntarios del coordinador.
class TeamScreen extends ConsumerWidget {
  const TeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(teamNotifierProvider);
    final notifier = ref.read(teamNotifierProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Mi Equipo',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
        actions: [
          if (state.isLoading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Actualizar',
              onPressed: notifier.refreshTeam,
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: notifier.refreshTeam,
        color: AppColors.primary,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Header card de progreso ────────────────────────────────────────
            _TeamProgressCard(progress: state.teamProgress),
            const SizedBox(height: 16),

            // ── Alertas ────────────────────────────────────────────────────────
            TeamAlertBanner(
              alerts: state.alerts,
              isExpanded: state.alertsExpanded,
              onToggle: notifier.toggleAlerts,
              onAlertTap: (alert) => _handleAlertTap(context, alert),
              onDismiss: notifier.dismissAlert,
            ),

            // ── Lista de voluntarios ───────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  const Text(
                    'Voluntarios',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${state.volunteers.length}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (state.volunteers.isEmpty)
              const _EmptyVolunteers()
            else
              ...state.volunteers.map(
                (v) => VolunteerStatusCard(
                  volunteer: v,
                  onTap: () => VolunteerDetailSheet.show(
                    context,
                    volunteer: v,
                    onSendMessage: () => _showSendMessageSheet(context, ref, v.id, v.fullName),
                    onReassignTerritory: () => _showReassignDialog(context, ref, v.id, v.fullName),
                  ),
                ),
              ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  void _handleAlertTap(BuildContext context, TeamAlert alert) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(alert.message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.warning,
      ),
    );
  }

  void _showSendMessageSheet(
    BuildContext context,
    WidgetRef ref,
    String volunteerId,
    String volunteerName,
  ) {
    final controller = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mensaje a $volunteerName',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                autofocus: true,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Escribe tu mensaje...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () async {
                    if (controller.text.trim().isNotEmpty) {
                      await ref
                          .read(teamNotifierProvider.notifier)
                          .sendMessage(volunteerId, controller.text.trim());
                      if (ctx.mounted) Navigator.pop(ctx);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Enviar', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showReassignDialog(
    BuildContext context,
    WidgetRef ref,
    String volunteerId,
    String volunteerName,
  ) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text('Reasignar a $volunteerName'),
        content: const Text(
          'En la versión completa podrás seleccionar un territorio del mapa.\n\nFuncionalidad disponible próximamente.',
          style: TextStyle(color: AppColors.subtleText),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }
}

// ── Team Progress Card ────────────────────────────────────────────────────────

class _TeamProgressCard extends StatelessWidget {
  const _TeamProgressCard({required this.progress});
  final TeamProgress progress;

  @override
  Widget build(BuildContext context) {
    final percent = progress.progressFraction;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      progress.teamName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      progress.zoneName,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.subtleText,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _progressColor(percent * 100).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${(percent * 100).toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: _progressColor(percent * 100),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progreso del día',
                style: const TextStyle(fontSize: 13, color: AppColors.subtleText),
              ),
              Text(
                '${progress.housesCompleted} de ${progress.housesTotal} casas completadas',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: percent,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(_progressColor(percent * 100)),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Color _progressColor(double percent) {
    if (percent >= 80) return AppColors.success;
    if (percent >= 50) return AppColors.warning;
    return AppColors.error;
  }
}

class _EmptyVolunteers extends StatelessWidget {
  const _EmptyVolunteers();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.group_off_outlined, size: 56, color: AppColors.border),
            SizedBox(height: 12),
            Text(
              'No hay voluntarios asignados',
              style: TextStyle(color: AppColors.subtleText, fontSize: 15),
            ),
          ],
        ),
      ),
    );
  }
}
