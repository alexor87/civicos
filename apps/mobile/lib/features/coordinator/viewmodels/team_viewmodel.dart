import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/models/volunteer_summary.dart';

part 'team_viewmodel.g.dart';

// ── Models ────────────────────────────────────────────────────────────────────

enum AlertType { inactiveVolunteer, riskZone, rejectedRecord }

class TeamAlert {
  const TeamAlert({
    required this.id,
    required this.type,
    required this.message,
    required this.volunteerId,
    this.metadata,
  });

  final String id;
  final AlertType type;
  final String message;
  final String? volunteerId;
  final Map<String, dynamic>? metadata;
}

class TeamProgress {
  const TeamProgress({
    required this.housesCompleted,
    required this.housesTotal,
    required this.teamName,
    required this.zoneName,
  });

  final int housesCompleted;
  final int housesTotal;
  final String teamName;
  final String zoneName;

  double get progressFraction =>
      housesTotal == 0 ? 0 : (housesCompleted / housesTotal).clamp(0.0, 1.0);

  double get progressPercent => progressFraction * 100;
}

class TeamState {
  const TeamState({
    required this.volunteers,
    required this.alerts,
    required this.teamProgress,
    this.isLoading = false,
    this.alertsExpanded = true,
    this.error,
  });

  final List<VolunteerSummary> volunteers;
  final List<TeamAlert> alerts;
  final TeamProgress teamProgress;
  final bool isLoading;
  final bool alertsExpanded;
  final String? error;

  TeamState copyWith({
    List<VolunteerSummary>? volunteers,
    List<TeamAlert>? alerts,
    TeamProgress? teamProgress,
    bool? isLoading,
    bool? alertsExpanded,
    String? error,
  }) {
    return TeamState(
      volunteers: volunteers ?? this.volunteers,
      alerts: alerts ?? this.alerts,
      teamProgress: teamProgress ?? this.teamProgress,
      isLoading: isLoading ?? this.isLoading,
      alertsExpanded: alertsExpanded ?? this.alertsExpanded,
      error: error,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class TeamNotifier extends _$TeamNotifier {
  @override
  TeamState build() {
    // Datos de ejemplo para el prototipo. En producción: Supabase + Drift cache.
    return TeamState(
      isLoading: false,
      alertsExpanded: true,
      teamProgress: const TeamProgress(
        housesCompleted: 47,
        housesTotal: 120,
        teamName: 'Equipo Norte',
        zoneName: 'Zona Centro-Norte',
      ),
      alerts: [
        const TeamAlert(
          id: 'a1',
          type: AlertType.inactiveVolunteer,
          message: 'Ana Martínez sin actividad hace 45 min',
          volunteerId: 'v2',
        ),
        const TeamAlert(
          id: 'a2',
          type: AlertType.riskZone,
          message: 'Zona El Prado con baja cobertura (12%)',
          volunteerId: null,
          metadata: {'territory_id': 't3'},
        ),
        const TeamAlert(
          id: 'a3',
          type: AlertType.rejectedRecord,
          message: 'Registro rechazado de Luis Pérez — falta información',
          volunteerId: 'v3',
        ),
      ],
      volunteers: [
        VolunteerSummary(
          id: 'v1',
          fullName: 'Carlos Mendoza',
          territoryName: 'Sector Las Palmas',
          visitsCompleted: 18,
          visitsAssigned: 25,
          activityStatus: 'active',
          lastActivityAt: DateTime.now().subtract(const Duration(minutes: 5)),
        ),
        VolunteerSummary(
          id: 'v2',
          fullName: 'Ana Martínez',
          territoryName: 'Sector El Centro',
          visitsCompleted: 12,
          visitsAssigned: 20,
          activityStatus: 'inactive',
          lastActivityAt: DateTime.now().subtract(const Duration(minutes: 45)),
        ),
        VolunteerSummary(
          id: 'v3',
          fullName: 'Luis Pérez',
          territoryName: 'Sector El Prado',
          visitsCompleted: 8,
          visitsAssigned: 30,
          activityStatus: 'active',
          lastActivityAt: DateTime.now().subtract(const Duration(minutes: 3)),
        ),
        VolunteerSummary(
          id: 'v4',
          fullName: 'María Torres',
          territoryName: 'Sector Villa Nueva',
          visitsCompleted: 9,
          visitsAssigned: 25,
          activityStatus: 'offline',
          lastActivityAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        VolunteerSummary(
          id: 'v5',
          fullName: 'Jorge Ramírez',
          territoryName: 'Sector Los Álamos',
          visitsCompleted: 22,
          visitsAssigned: 22,
          activityStatus: 'active',
          lastActivityAt: DateTime.now().subtract(const Duration(minutes: 1)),
        ),
      ],
    );
  }

  Future<void> refreshTeam() async {
    state = state.copyWith(isLoading: true);
    await Future<void>.delayed(const Duration(seconds: 1));
    state = state.copyWith(isLoading: false);
  }

  Future<void> sendMessage(String volunteerId, String text) async {
    // En producción: llamar a Supabase para insertar mensaje.
    await Future<void>.delayed(const Duration(milliseconds: 300));
  }

  Future<void> reassignTerritory(String volunteerId, String newTerritoryId) async {
    // En producción: PATCH en Supabase y refrescar.
    await Future<void>.delayed(const Duration(milliseconds: 500));
    await refreshTeam();
  }

  void toggleAlerts() {
    state = state.copyWith(alertsExpanded: !state.alertsExpanded);
  }

  void dismissAlert(String alertId) {
    final updated = state.alerts.where((a) => a.id != alertId).toList();
    state = state.copyWith(alerts: updated);
  }
}

// ── Chat message model ────────────────────────────────────────────────────────

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.text,
    required this.sentAt,
    required this.isFromCoordinator,
    this.senderName,
  });

  final String id;
  final String text;
  final DateTime sentAt;
  final bool isFromCoordinator;
  final String? senderName;
}
