import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/services/auth_service.dart';

final _campaignsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = Supabase.instance.client;
  final user = client.auth.currentUser;
  if (user == null) return [];

  final data = await client
      .from('campaign_members')
      .select('campaign_id, campaigns(id, name, election_date)')
      .eq('user_id', user.id)
      .eq('is_active', true);

  return List<Map<String, dynamic>>.from(data);
});

/// Pantalla de selección de campaña para usuarios asignados a múltiples campañas.
class CampaignSelectorScreen extends ConsumerWidget {
  const CampaignSelectorScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignsAsync = ref.watch(_campaignsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Text('Selecciona tu campaña', style: AppTypography.title),
              const SizedBox(height: 8),
              Text(
                'Estás asignado a múltiples campañas. Elige con cuál trabajar hoy.',
                style: AppTypography.body.copyWith(color: AppColors.subtleText),
              ),
              const SizedBox(height: 32),

              Expanded(
                child: campaignsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => Center(
                    child: Text(
                      'Error al cargar campañas. Verifica tu conexión.',
                      style: AppTypography.body
                          .copyWith(color: AppColors.subtleText),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  data: (campaigns) {
                    if (campaigns.isEmpty) {
                      return Center(
                        child: Text(
                          'No tienes campañas activas asignadas.',
                          style: AppTypography.body
                              .copyWith(color: AppColors.subtleText),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }
                    return ListView.separated(
                      itemCount: campaigns.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final c = campaigns[index];
                        final campaign =
                            c['campaigns'] as Map<String, dynamic>? ?? {};
                        final name =
                            campaign['name'] as String? ?? 'Campaña';
                        final electionDate =
                            campaign['election_date'] as String?;

                        return _CampaignCard(
                          name: name,
                          electionDate: electionDate,
                          onTap: () async {
                            // Store selected campaign and refresh user
                            final supabase = Supabase.instance.client;
                            await supabase.from('profiles').update({
                              'campaign_id': campaign['id'],
                            }).eq('id', supabase.auth.currentUser!.id);
                            ref.invalidate(currentUserProvider);
                          },
                        );
                      },
                    );
                  },
                ),
              ),

              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () async {
                  await ref.read(authServiceProvider).logout();
                  ref.invalidate(currentUserProvider);
                },
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Cerrar sesión'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.subtleText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CampaignCard extends StatelessWidget {
  const _CampaignCard({
    required this.name,
    required this.electionDate,
    required this.onTap,
  });

  final String name;
  final String? electionDate;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.campaign_outlined,
                color: AppColors.primary,
                size: 26,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: AppTypography.headline),
                  if (electionDate != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Elección: $electionDate',
                      style: AppTypography.caption,
                    ),
                  ],
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              color: AppColors.subtleText,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
