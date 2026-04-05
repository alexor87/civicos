import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/services/auth_service.dart';

/// Pantalla mostrada a super_admin — acceso web solamente.
class BlockedScreen extends ConsumerWidget {
  const BlockedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Ícono
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.warning.withAlpha(30),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.desktop_mac_outlined,
                  color: AppColors.warning,
                  size: 44,
                ),
              ),
              const SizedBox(height: 28),

              Text(
                'Acceso solo desde web',
                style: AppTypography.title.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              Text(
                'Tu rol de Super Admin requiere la plataforma web completa. '
                'Inicia sesión en scrutix.app desde tu computador.',
                style: AppTypography.body.copyWith(
                  color: AppColors.subtleText,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 48),

              OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authServiceProvider).logout();
                  ref.invalidate(currentUserProvider);
                },
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar sesión'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  foregroundColor: AppColors.subtleText,
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
