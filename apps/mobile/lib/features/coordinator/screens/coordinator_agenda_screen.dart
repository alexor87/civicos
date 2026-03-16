import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/services/auth_service.dart';

/// Agenda del Field Coordinator — solo lectura.
class CoordinatorAgendaScreen extends ConsumerWidget {
  const CoordinatorAgendaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);

    return userAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const Scaffold(
        body: Center(child: Text('Error al cargar agenda')),
      ),
      data: (user) => _AgendaBody(campaignId: user?.campaignId ?? ''),
    );
  }
}

class _AgendaBody extends ConsumerWidget {
  const _AgendaBody({required this.campaignId});
  final String campaignId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(_agendaEventsProvider(campaignId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Agenda'),
        backgroundColor: AppColors.surface,
        automaticallyImplyLeading: false,
      ),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Text(
            'Sin conexión — agenda no disponible',
            style: AppTypography.body.copyWith(color: AppColors.subtleText),
          ),
        ),
        data: (events) {
          if (events.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.calendar_today_outlined,
                      size: 56, color: AppColors.placeholderText),
                  const SizedBox(height: 16),
                  Text(
                    'Sin eventos próximos',
                    style: AppTypography.body.copyWith(color: AppColors.subtleText),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) => _EventCard(event: events[index]),
          );
        },
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event});
  final Map<String, dynamic> event;

  @override
  Widget build(BuildContext context) {
    final title = event['title'] as String? ?? 'Evento';
    final description = event['description'] as String? ?? '';
    final startAt = event['start_at'] != null
        ? DateTime.tryParse(event['start_at'] as String)
        : null;
    final location = event['location'] as String?;
    final eventType = event['event_type'] as String? ?? 'general';

    final typeColor = switch (eventType) {
      'meeting' => AppColors.primary,
      'canvassing' => AppColors.fieldGreen,
      'training' => AppColors.info,
      'rally' => AppColors.warning,
      _ => AppColors.subtleText,
    };

    final typeLabel = switch (eventType) {
      'meeting' => 'Reunión',
      'canvassing' => 'Canvassing',
      'training' => 'Capacitación',
      'rally' => 'Mitin',
      _ => 'General',
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: typeColor.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Text(
                  startAt != null ? '${startAt.day}' : '--',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: typeColor),
                ),
                Text(
                  startAt != null ? _monthAbbr(startAt.month) : '',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: typeColor),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: typeColor.withAlpha(20),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    typeLabel,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: typeColor),
                  ),
                ),
                const SizedBox(height: 6),
                Text(title, style: AppTypography.headline),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(description,
                      style: AppTypography.body.copyWith(color: AppColors.subtleText),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                ],
                if (location != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.subtleText),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(location, style: AppTypography.caption, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ],
                if (startAt != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 14, color: AppColors.subtleText),
                      const SizedBox(width: 4),
                      Text(_formatTime(startAt), style: AppTypography.caption),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _monthAbbr(int month) {
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    return months[month - 1];
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

final _agendaEventsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, campaignId) async {
    if (campaignId.isEmpty) return [];
    final now = DateTime.now().toIso8601String();
    final data = await Supabase.instance.client
        .from('agenda_events')
        .select()
        .eq('campaign_id', campaignId)
        .gte('start_at', now)
        .order('start_at');
    return List<Map<String, dynamic>>.from(data);
  },
);
