import 'dart:async';

import 'package:latlong2/latlong.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/models/territory.dart';

part 'live_map_viewmodel.g.dart';

// ── Models ────────────────────────────────────────────────────────────────────

enum VisitResult { contacted, notHome, refused }

enum MapLayer { territories, recentVisits, volunteerPositions }

class MapVisitPin {
  const MapVisitPin({
    required this.id,
    required this.position,
    required this.result,
    required this.contactName,
    required this.volunteerName,
    required this.recordedAt,
    this.notes,
    this.status = 'submitted',
  });

  final String id;
  final LatLng position;
  final VisitResult result;
  final String contactName;
  final String volunteerName;
  final DateTime recordedAt;
  final String? notes;

  /// Estado del registro: 'submitted' | 'approved' | 'rejected'.
  final String status;
}

class VolunteerPosition {
  const VolunteerPosition({
    required this.volunteerId,
    required this.volunteerName,
    required this.position,
    required this.updatedAt,
    this.avatarUrl,
  });

  final String volunteerId;
  final String volunteerName;
  final LatLng position;
  final DateTime updatedAt;
  final String? avatarUrl;
}

class TerritoryWithCoverage {
  const TerritoryWithCoverage({
    required this.territory,
    required this.points,
    this.assignedVolunteerName,
    this.visitsCompleted = 0,
    this.visitsTotal = 0,
  });

  final Territory territory;
  final List<LatLng> points;
  final String? assignedVolunteerName;
  final int visitsCompleted;
  final int visitsTotal;

  double get coveragePercent => territory.coveragePercent ?? 0;
}

class LiveMapState {
  const LiveMapState({
    required this.territories,
    required this.recentVisits,
    required this.volunteerPositions,
    required this.visibleLayers,
    this.isLoading = false,
    this.isPanelExpanded = false,
    this.selectedTerritoryId,
    this.selectedVisitId,
    this.userPosition,
  });

  final List<TerritoryWithCoverage> territories;
  final List<MapVisitPin> recentVisits;
  final List<VolunteerPosition> volunteerPositions;
  final Set<MapLayer> visibleLayers;
  final bool isLoading;
  final bool isPanelExpanded;
  final String? selectedTerritoryId;
  final String? selectedVisitId;
  final LatLng? userPosition;

  LiveMapState copyWith({
    List<TerritoryWithCoverage>? territories,
    List<MapVisitPin>? recentVisits,
    List<VolunteerPosition>? volunteerPositions,
    Set<MapLayer>? visibleLayers,
    bool? isLoading,
    bool? isPanelExpanded,
    String? selectedTerritoryId,
    String? selectedVisitId,
    LatLng? userPosition,
    bool clearSelectedTerritory = false,
    bool clearSelectedVisit = false,
  }) {
    return LiveMapState(
      territories: territories ?? this.territories,
      recentVisits: recentVisits ?? this.recentVisits,
      volunteerPositions: volunteerPositions ?? this.volunteerPositions,
      visibleLayers: visibleLayers ?? this.visibleLayers,
      isLoading: isLoading ?? this.isLoading,
      isPanelExpanded: isPanelExpanded ?? this.isPanelExpanded,
      selectedTerritoryId:
          clearSelectedTerritory ? null : selectedTerritoryId ?? this.selectedTerritoryId,
      selectedVisitId:
          clearSelectedVisit ? null : selectedVisitId ?? this.selectedVisitId,
      userPosition: userPosition ?? this.userPosition,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class LiveMapNotifier extends _$LiveMapNotifier {
  StreamController<VolunteerPosition>? _positionStream;

  @override
  LiveMapState build() {
    ref.onDispose(() => _positionStream?.close());
    _startPositionSimulation();

    return LiveMapState(
      isLoading: false,
      isPanelExpanded: false,
      visibleLayers: {
        MapLayer.territories,
        MapLayer.recentVisits,
        MapLayer.volunteerPositions,
      },
      // Bogotá, Colombia — coordenadas de ejemplo
      userPosition: const LatLng(4.7110, -74.0721),
      territories: [
        TerritoryWithCoverage(
          territory: Territory(
            id: 't1',
            campaignId: 'camp1',
            name: 'Sector Las Palmas',
            coveragePercent: 72,
            syncedAt: DateTime.now(),
          ),
          points: const [
            LatLng(4.716, -74.075),
            LatLng(4.720, -74.075),
            LatLng(4.720, -74.070),
            LatLng(4.716, -74.070),
          ],
          assignedVolunteerName: 'Carlos Mendoza',
          visitsCompleted: 18,
          visitsTotal: 25,
        ),
        TerritoryWithCoverage(
          territory: Territory(
            id: 't2',
            campaignId: 'camp1',
            name: 'Sector El Centro',
            coveragePercent: 45,
            syncedAt: DateTime.now(),
          ),
          points: const [
            LatLng(4.710, -74.075),
            LatLng(4.715, -74.075),
            LatLng(4.715, -74.069),
            LatLng(4.710, -74.069),
          ],
          assignedVolunteerName: 'Ana Martínez',
          visitsCompleted: 12,
          visitsTotal: 20,
        ),
        TerritoryWithCoverage(
          territory: Territory(
            id: 't3',
            campaignId: 'camp1',
            name: 'Sector El Prado',
            coveragePercent: 12,
            syncedAt: DateTime.now(),
          ),
          points: const [
            LatLng(4.705, -74.075),
            LatLng(4.710, -74.075),
            LatLng(4.710, -74.069),
            LatLng(4.705, -74.069),
          ],
          assignedVolunteerName: 'Luis Pérez',
          visitsCompleted: 8,
          visitsTotal: 30,
        ),
        TerritoryWithCoverage(
          territory: Territory(
            id: 't4',
            campaignId: 'camp1',
            name: 'Sector Villa Nueva',
            coveragePercent: 95,
            syncedAt: DateTime.now(),
          ),
          points: const [
            LatLng(4.720, -74.069),
            LatLng(4.725, -74.069),
            LatLng(4.725, -74.063),
            LatLng(4.720, -74.063),
          ],
          assignedVolunteerName: 'Jorge Ramírez',
          visitsCompleted: 22,
          visitsTotal: 22,
        ),
      ],
      recentVisits: [
        MapVisitPin(
          id: 'vp1',
          position: const LatLng(4.717, -74.073),
          result: VisitResult.contacted,
          contactName: 'Roberto Gómez',
          volunteerName: 'Carlos Mendoza',
          recordedAt: DateTime.now().subtract(const Duration(minutes: 15)),
          status: 'submitted',
        ),
        MapVisitPin(
          id: 'vp2',
          position: const LatLng(4.712, -74.072),
          result: VisitResult.notHome,
          contactName: 'Sandra López',
          volunteerName: 'Ana Martínez',
          recordedAt: DateTime.now().subtract(const Duration(minutes: 40)),
          status: 'approved',
        ),
        MapVisitPin(
          id: 'vp3',
          position: const LatLng(4.707, -74.074),
          result: VisitResult.refused,
          contactName: 'Pedro Vargas',
          volunteerName: 'Luis Pérez',
          recordedAt: DateTime.now().subtract(const Duration(hours: 1)),
          status: 'submitted',
        ),
      ],
      volunteerPositions: [
        VolunteerPosition(
          volunteerId: 'v1',
          volunteerName: 'Carlos Mendoza',
          position: const LatLng(4.7175, -74.0729),
          updatedAt: DateTime.now().subtract(const Duration(minutes: 2)),
        ),
        VolunteerPosition(
          volunteerId: 'v3',
          volunteerName: 'Luis Pérez',
          position: const LatLng(4.7072, -74.0735),
          updatedAt: DateTime.now().subtract(const Duration(minutes: 4)),
        ),
      ],
    );
  }

  void _startPositionSimulation() {
    _positionStream = StreamController<VolunteerPosition>();
    // Simula actualizaciones de posición en tiempo real.
    // En producción: Supabase Realtime channel subscription.
  }

  void toggleLayer(MapLayer layer) {
    final current = Set<MapLayer>.from(state.visibleLayers);
    if (current.contains(layer)) {
      current.remove(layer);
    } else {
      current.add(layer);
    }
    state = state.copyWith(visibleLayers: current);
  }

  void centerOnTeam() {
    // En producción: calcular bounding box de todos los voluntarios activos.
    state = state.copyWith(userPosition: const LatLng(4.7110, -74.0721));
  }

  void togglePanel() {
    state = state.copyWith(isPanelExpanded: !state.isPanelExpanded);
  }

  void selectTerritory(String? id) {
    if (id == null) {
      state = state.copyWith(clearSelectedTerritory: true);
    } else {
      state = state.copyWith(selectedTerritoryId: id);
    }
  }

  void selectVisit(String? id) {
    if (id == null) {
      state = state.copyWith(clearSelectedVisit: true);
    } else {
      state = state.copyWith(selectedVisitId: id);
    }
  }

  Future<void> approveVisit(String visitId) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final updated = state.recentVisits.map((v) {
      if (v.id == visitId) {
        return MapVisitPin(
          id: v.id,
          position: v.position,
          result: v.result,
          contactName: v.contactName,
          volunteerName: v.volunteerName,
          recordedAt: v.recordedAt,
          notes: v.notes,
          status: 'approved',
        );
      }
      return v;
    }).toList();
    state = state.copyWith(recentVisits: updated, clearSelectedVisit: true);
  }
}
