import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../viewmodels/volunteer_home_viewmodel.dart';

/// Pantalla de ajustes del voluntario.
class VolunteerSettingsScreen extends ConsumerStatefulWidget {
  const VolunteerSettingsScreen({super.key});

  static const routePath = '/volunteer/settings';

  @override
  ConsumerState<VolunteerSettingsScreen> createState() =>
      _VolunteerSettingsScreenState();
}

class _VolunteerSettingsScreenState
    extends ConsumerState<VolunteerSettingsScreen> {
  bool _biometricEnabled = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(volunteerHomeNotifierProvider);
    final notifier = ref.read(volunteerHomeNotifierProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Ajustes'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 16),
        children: [
          // ── Sección Cuenta ──────────────────────────────────────────────
          _SectionHeader(label: 'Cuenta'),
          _InfoTile(
            icon: Icons.person_outline,
            label: 'Nombre',
            value: state.volunteerName,
          ),
          _InfoTile(
            icon: Icons.email_outlined,
            label: 'Correo',
            value: 'voluntario@civicos.co',
          ),
          _InfoTile(
            icon: Icons.badge_outlined,
            label: 'Rol',
            value: 'Voluntario',
          ),
          _InfoTile(
            icon: Icons.campaign_outlined,
            label: 'Campaña activa',
            value: 'Alcaldía Medellín 2027',
          ),

          const SizedBox(height: 8),

          // ── Sección Seguridad ───────────────────────────────────────────
          _SectionHeader(label: 'Seguridad'),
          _SwitchTile(
            icon: Icons.fingerprint,
            label: 'Autenticación biométrica',
            subtitle: 'Usa huella dactilar o Face ID para ingresar',
            value: _biometricEnabled,
            onChanged: (v) => setState(() => _biometricEnabled = v),
          ),
          _ActionTile(
            icon: Icons.lock_outline,
            label: 'Cambiar contraseña',
            onTap: () {
              _showChangePasswordDialog(context);
            },
          ),

          const SizedBox(height: 8),

          // ── Sección Sincronización ──────────────────────────────────────
          _SectionHeader(label: 'Sincronización'),
          _InfoTile(
            icon: Icons.cloud_sync_outlined,
            label: 'Última sincronización',
            value: state.lastSyncAt != null
                ? _formatSyncTime(state.lastSyncAt!)
                : 'Nunca',
          ),
          _InfoTile(
            icon: Icons.pending_actions_outlined,
            label: 'Registros pendientes de subir',
            value: '0',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: state.isSyncing ? null : () => notifier.syncNow(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: state.isSyncing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.sync, size: 20),
                label: Text(
                  state.isSyncing ? 'Sincronizando…' : 'Sincronizar ahora',
                  style: AppTypography.bodyVolunteer.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // ── Sección App ─────────────────────────────────────────────────
          _SectionHeader(label: 'Aplicación'),
          _InfoTile(
            icon: Icons.info_outline,
            label: 'Versión',
            value: '1.0.0',
          ),

          const SizedBox(height: 24),

          // ── Cerrar sesión ───────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              height: 60,
              child: OutlinedButton.icon(
                onPressed: () => _confirmSignOut(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                icon: const Icon(Icons.logout, size: 22),
                label: Text(
                  'Cerrar sesión',
                  style: AppTypography.bodyVolunteer.copyWith(
                    color: AppColors.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  String _formatSyncTime(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return 'Ahora mismo';
    if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
    return t.toString().substring(0, 16);
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Cerrar sesión?'),
        content: const Text(
          'Se perderá el acceso a la app hasta que vuelvas a iniciar sesión.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await ref.read(authServiceProvider).logout();
      if (mounted) context.go('/login');
    }
  }

  Future<void> _showChangePasswordDialog(BuildContext context) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cambiar contraseña'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Se enviará un enlace de restablecimiento a tu correo registrado.',
              style: AppTypography.body,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                      'Enlace enviado a tu correo electrónico.'),
                ),
              );
            },
            child: const Text('Enviar enlace'),
          ),
        ],
      ),
    );
  }
}

// ── Widgets internos de ajustes ───────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        label.toUpperCase(),
        style: AppTypography.caption.copyWith(
          color: AppColors.subtleText,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          fontSize: 11,
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.subtleText, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.subtleText,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value,
                  style: AppTypography.bodyVolunteer.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.subtleText, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.bodyVolunteer.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  subtitle,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.subtleText,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    const color = AppColors.onSurface;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: AppTypography.bodyVolunteer.copyWith(
                  color: color,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: AppColors.subtleText,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
