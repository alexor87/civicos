import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../viewmodels/volunteer_home_viewmodel.dart';
import '../widgets/coordinator_message_card.dart';

/// Pantalla principal del voluntario.
///
/// Una sola mano, bajo el sol, con mala señal.
/// Foco absoluto en: progreso del día, acceso rápido a las casas y mensajes.
class VolunteerHomeScreen extends ConsumerWidget {
  const VolunteerHomeScreen({super.key});

  static const routePath = '/volunteer/home';

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(volunteerHomeNotifierProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── AppBar personalizado ────────────────────────────────────────
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.surface,
              elevation: 0,
              scrolledUnderElevation: 1,
              shadowColor: AppColors.border,
              title: Row(
                children: [
                  // Logo / ícono
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.how_to_vote_outlined,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'CivicOS',
                    style: AppTypography.headline.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              actions: [
                // Indicador de sync
                IconButton(
                  onPressed: () => ref
                      .read(volunteerHomeNotifierProvider.notifier)
                      .syncNow(),
                  icon: state.isSyncing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(AppColors.primary),
                          ),
                        )
                      : const Icon(Icons.sync, color: AppColors.subtleText),
                  tooltip: 'Sincronizar',
                ),
                // Notificaciones
                IconButton(
                  onPressed: () => context.go('/volunteer/notifications'),
                  icon: Badge(
                    isLabelVisible: state.messages.any((m) => !m.isRead),
                    backgroundColor: AppColors.error,
                    child: const Icon(
                      Icons.notifications_outlined,
                      color: AppColors.subtleText,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
              ],
            ),

            // ── Banner offline ──────────────────────────────────────────────
            if (!state.isOnline)
              SliverToBoxAdapter(
                child: Container(
                  color: AppColors.warning,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.wifi_off,
                        color: Colors.white,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Sin conexión — los cambios se guardarán localmente',
                          style: AppTypography.label.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // ── Cuerpo scrollable ───────────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Saludo
                  Text(
                    '${_greeting()}, ${state.volunteerName} 👋',
                    style: AppTypography.title,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tu misión de hoy',
                    style: AppTypography.body.copyWith(
                      color: AppColors.subtleText,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Círculo de progreso ─────────────────────────────────
                  Center(
                    child: _ProgressCircle(
                      progress: state.progress,
                      isComplete: state.isComplete,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Texto motivacional
                  Center(
                    child: Text(
                      state.pending > 0
                          ? 'Tienes ${state.pending} casas pendientes hoy'
                          : '¡Completaste todas tus casas hoy! 🎉',
                      style: AppTypography.bodyVolunteer.copyWith(
                        color: state.isComplete
                            ? AppColors.fieldGreen
                            : AppColors.subtleText,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Botón principal ─────────────────────────────────────
                  SizedBox(
                    height: 64,
                    child: ElevatedButton.icon(
                      onPressed: () => context.go('/volunteer/houses'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                        textStyle: AppTypography.headlineVolunteer.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      icon: const Icon(Icons.home_work_outlined, size: 26),
                      label: const Text('Ir a mis casas →'),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Grid 2x2 contadores ─────────────────────────────────
                  Text(
                    'Resumen del día',
                    style: AppTypography.headline,
                  ),
                  const SizedBox(height: 12),
                  _CounterGrid(
                    contacted: state.contacted,
                    notHome: state.notHome,
                    refused: state.refused,
                    pending: state.pending,
                  ),

                  const SizedBox(height: 28),

                  // ── Mensajes del coordinador ────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Mensajes del coordinador',
                        style: AppTypography.headline,
                      ),
                      TextButton(
                        onPressed: () =>
                            context.go('/volunteer/notifications'),
                        child: const Text('Ver todos'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ...state.messages.take(3).map(
                        (msg) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: CoordinatorMessageCard(
                            message: msg,
                            onTap: () => ref
                                .read(
                                    volunteerHomeNotifierProvider.notifier)
                                .markMessageRead(msg.id),
                          ),
                        ),
                      ),

                  const SizedBox(height: 16),

                  // Timestamp de última sync
                  if (state.lastSyncAt != null)
                    Center(
                      child: Text(
                        'Última sincronización: ${_formatSyncTime(state.lastSyncAt!)}',
                        style: AppTypography.caption,
                      ),
                    ),

                  const SizedBox(height: 32),
                ]),
              ),
            ),
          ],
        ),
      ),

      // ── Bottom navigation del voluntario ─────────────────────────────────
      bottomNavigationBar: _VolunteerBottomNav(currentIndex: 0),
    );
  }

  String _formatSyncTime(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return 'ahora mismo';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    return 'hace ${diff.inHours} h';
  }
}

// ── Círculo de progreso personalizado ─────────────────────────────────────────

class _ProgressCircle extends StatelessWidget {
  const _ProgressCircle({
    required this.progress,
    required this.isComplete,
  });

  final double progress;
  final bool isComplete;

  @override
  Widget build(BuildContext context) {
    final color = isComplete ? AppColors.fieldGreen : AppColors.primary;
    final percent = (progress * 100).round();

    return SizedBox(
      width: 140,
      height: 140,
      child: CustomPaint(
        painter: _CircleProgressPainter(
          progress: progress,
          color: color,
          trackColor: AppColors.border,
          strokeWidth: 12,
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$percent%',
                style: AppTypography.display.copyWith(
                  color: color,
                  fontWeight: FontWeight.w800,
                  fontSize: 32,
                ),
              ),
              Text(
                isComplete ? 'Listo 🎉' : 'hoy',
                style: AppTypography.caption.copyWith(
                  color: AppColors.subtleText,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CircleProgressPainter extends CustomPainter {
  const _CircleProgressPainter({
    required this.progress,
    required this.color,
    required this.trackColor,
    required this.strokeWidth,
  });

  final double progress;
  final Color color;
  final Color trackColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi,
      false,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );

    if (progress > 0) {
      // Progress arc
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(_CircleProgressPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}

// ── Grid 2x2 de contadores ─────────────────────────────────────────────────────

class _CounterGrid extends StatelessWidget {
  const _CounterGrid({
    required this.contacted,
    required this.notHome,
    required this.refused,
    required this.pending,
  });

  final int contacted;
  final int notHome;
  final int refused;
  final int pending;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.8,
      children: [
        _CounterCard(
          icon: Icons.check_circle,
          iconColor: AppColors.success,
          label: 'Contactados',
          count: contacted,
          bgColor: AppColors.success.withAlpha(20),
        ),
        _CounterCard(
          icon: Icons.home_outlined,
          iconColor: AppColors.notHome,
          label: 'No estaban',
          count: notHome,
          bgColor: AppColors.notHome.withAlpha(20),
        ),
        _CounterCard(
          icon: Icons.cancel_outlined,
          iconColor: AppColors.error,
          label: 'Rechazos',
          count: refused,
          bgColor: AppColors.error.withAlpha(20),
        ),
        _CounterCard(
          icon: Icons.pending_outlined,
          iconColor: AppColors.warning,
          label: 'Pendientes',
          count: pending,
          bgColor: AppColors.warning.withAlpha(20),
        ),
      ],
    );
  }
}

class _CounterCard extends StatelessWidget {
  const _CounterCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.count,
    required this.bgColor,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final int count;
  final Color bgColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: iconColor.withAlpha(60),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 28),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$count',
                  style: AppTypography.title.copyWith(
                    color: iconColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 24,
                  ),
                ),
                Text(
                  label,
                  style: AppTypography.caption.copyWith(
                    color: iconColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Bottom navigation bar del voluntario ──────────────────────────────────────

class _VolunteerBottomNav extends StatelessWidget {
  const _VolunteerBottomNav({required this.currentIndex});

  final int currentIndex;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        backgroundColor: Colors.transparent,
        elevation: 0,
        onTap: (index) {
          switch (index) {
            case 0:
              context.go('/volunteer/home');
            case 1:
              context.go('/volunteer/houses');
            case 2:
              context.go('/volunteer/notifications');
            case 3:
              context.go('/volunteer/settings');
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.location_city_outlined),
            activeIcon: Icon(Icons.location_city),
            label: 'Mis Casas',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications_outlined),
            activeIcon: Icon(Icons.notifications),
            label: 'Mensajes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
