import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/theme/app_colors.dart';
import '../viewmodels/live_map_viewmodel.dart';
import '../widgets/territory_coverage_legend.dart';

/// Mapa en tiempo real con territorios, visitas y posiciones de voluntarios.
class LiveMapScreen extends ConsumerStatefulWidget {
  const LiveMapScreen({super.key});

  @override
  ConsumerState<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends ConsumerState<LiveMapScreen> {
  final _mapController = MapController();
  bool _showLegend = false;

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(liveMapNotifierProvider);
    final notifier = ref.read(liveMapNotifierProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Mapa en Vivo',
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
          IconButton(
            icon: Icon(
              _showLegend ? Icons.layers : Icons.layers_outlined,
              color: _showLegend ? AppColors.primary : AppColors.onSurface,
            ),
            tooltip: 'Leyenda y capas',
            onPressed: () => setState(() => _showLegend = !_showLegend),
          ),
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Centrar en mi equipo',
            onPressed: () {
              notifier.centerOnTeam();
              if (state.userPosition != null) {
                _mapController.move(state.userPosition!, 14);
              }
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // ── Mapa ────────────────────────────────────────────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: state.userPosition ?? const LatLng(4.7110, -74.0721),
              initialZoom: 14,
              onTap: (_, __) {
                notifier.selectTerritory(null);
                notifier.selectVisit(null);
              },
            ),
            children: [
              // Tile layer — OpenStreetMap
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.civicos.mobile',
              ),

              // Capa 1: Territorios
              if (state.visibleLayers.contains(MapLayer.territories))
                PolygonLayer(
                  polygons: state.territories.map((t) {
                    final color = _territoryColor(t.coveragePercent);
                    final isSelected = t.territory.id == state.selectedTerritoryId;
                    return Polygon(
                      points: t.points,
                      color: color.withValues(alpha: 0.3),
                      borderColor: isSelected ? AppColors.primary : color,
                      borderStrokeWidth: isSelected ? 3 : 2,
                    );
                  }).toList(),
                ),

              // Capa 1 (tap): GestureDetector sobre territorios
              if (state.visibleLayers.contains(MapLayer.territories))
                PolygonLayer(
                  polygons: state.territories.map((t) {
                    return Polygon(
                      points: t.points,
                      color: Colors.transparent,
                      borderColor: Colors.transparent,
                      borderStrokeWidth: 0,
                    );
                  }).toList(),
                ),

              // Capa 2: Pins de visitas recientes
              if (state.visibleLayers.contains(MapLayer.recentVisits))
                MarkerLayer(
                  markers: state.recentVisits.map((v) {
                    return Marker(
                      point: v.position,
                      width: 28,
                      height: 28,
                      child: GestureDetector(
                        onTap: () => _showVisitSheet(context, ref, v),
                        child: Container(
                          decoration: BoxDecoration(
                            color: _visitColor(v.result),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),

              // Capa 3: Posiciones de voluntarios
              if (state.visibleLayers.contains(MapLayer.volunteerPositions))
                MarkerLayer(
                  markers: state.volunteerPositions.map((vp) {
                    return Marker(
                      point: vp.position,
                      width: 40,
                      height: 48,
                      child: Column(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.25),
                                  blurRadius: 6,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                vp.volunteerName.isNotEmpty ? vp.volunteerName[0].toUpperCase() : '?',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ),
                          Container(
                            width: 2,
                            height: 8,
                            color: AppColors.primary,
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),

          // ── Territory tap detection ──────────────────────────────────────────
          // (handled via territory tap markers below)

          // ── Leyenda flotante ────────────────────────────────────────────────
          if (_showLegend)
            Positioned(
              top: 12,
              right: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const TerritoryCoverageLegend(),
                  const SizedBox(height: 8),
                  _LayerToggles(
                    visibleLayers: state.visibleLayers,
                    onToggle: notifier.toggleLayer,
                  ),
                ],
              ),
            ),

          // ── Panel inferior de territorios ───────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _TerritoryPanel(
              territories: state.territories,
              isExpanded: state.isPanelExpanded,
              onToggle: notifier.togglePanel,
              onTerritoryTap: (t) => _showTerritorySheet(context, ref, t),
            ),
          ),
        ],
      ),
    );
  }

  Color _territoryColor(double percent) {
    if (percent <= 30) return AppColors.error;
    if (percent <= 60) return AppColors.warning;
    if (percent <= 90) return const Color(0xFFF5E642);
    return AppColors.success;
  }

  Color _visitColor(VisitResult result) {
    return switch (result) {
      VisitResult.contacted => AppColors.success,
      VisitResult.notHome => AppColors.subtleText,
      VisitResult.refused => AppColors.error,
    };
  }

  void _showTerritorySheet(
    BuildContext context,
    WidgetRef ref,
    TerritoryWithCoverage territory,
  ) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _TerritoryBottomSheet(
        territory: territory,
        onReassign: () {
          Navigator.pop(ctx);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Reasignación disponible próximamente'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
      ),
    );
  }

  void _showVisitSheet(BuildContext context, WidgetRef ref, MapVisitPin visit) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _VisitBottomSheet(
        visit: visit,
        onApprove: visit.status == 'submitted'
            ? () async {
                Navigator.pop(ctx);
                await ref.read(liveMapNotifierProvider.notifier).approveVisit(visit.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Visita aprobada'),
                      backgroundColor: AppColors.success,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              }
            : null,
      ),
    );
  }
}

// ── Layer Toggles ─────────────────────────────────────────────────────────────

class _LayerToggles extends StatelessWidget {
  const _LayerToggles({required this.visibleLayers, required this.onToggle});

  final Set<MapLayer> visibleLayers;
  final void Function(MapLayer) onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Capas',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.subtleText,
            ),
          ),
          const SizedBox(height: 4),
          _LayerToggleRow(
            label: 'Territorios',
            isVisible: visibleLayers.contains(MapLayer.territories),
            onToggle: () => onToggle(MapLayer.territories),
          ),
          _LayerToggleRow(
            label: 'Visitas (2h)',
            isVisible: visibleLayers.contains(MapLayer.recentVisits),
            onToggle: () => onToggle(MapLayer.recentVisits),
          ),
          _LayerToggleRow(
            label: 'Voluntarios',
            isVisible: visibleLayers.contains(MapLayer.volunteerPositions),
            onToggle: () => onToggle(MapLayer.volunteerPositions),
          ),
        ],
      ),
    );
  }
}

class _LayerToggleRow extends StatelessWidget {
  const _LayerToggleRow({
    required this.label,
    required this.isVisible,
    required this.onToggle,
  });

  final String label;
  final bool isVisible;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isVisible ? Icons.check_box : Icons.check_box_outline_blank,
            size: 16,
            color: isVisible ? AppColors.primary : AppColors.subtleText,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: isVisible ? AppColors.onSurface : AppColors.subtleText,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Territory Panel ───────────────────────────────────────────────────────────

class _TerritoryPanel extends StatelessWidget {
  const _TerritoryPanel({
    required this.territories,
    required this.isExpanded,
    required this.onToggle,
    required this.onTerritoryTap,
  });

  final List<TerritoryWithCoverage> territories;
  final bool isExpanded;
  final VoidCallback onToggle;
  final void Function(TerritoryWithCoverage) onTerritoryTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: onToggle,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                children: [
                  Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Territorios',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        isExpanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_up,
                        size: 18,
                        color: AppColors.subtleText,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            child: isExpanded
                ? SizedBox(
                    height: 200,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      itemCount: territories.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 6),
                      itemBuilder: (_, i) {
                        final t = territories[i];
                        return GestureDetector(
                          onTap: () => onTerritoryTap(t),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: _coverageColor(t.coveragePercent),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    t.territory.name,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.onSurface,
                                    ),
                                  ),
                                ),
                                Text(
                                  '${t.coveragePercent.toStringAsFixed(0)}%',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: _coverageColor(t.coveragePercent),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Color _coverageColor(double percent) {
    if (percent <= 30) return AppColors.error;
    if (percent <= 60) return AppColors.warning;
    if (percent <= 90) return const Color(0xFFC7AB00);
    return AppColors.success;
  }
}

// ── Territory Bottom Sheet ────────────────────────────────────────────────────

class _TerritoryBottomSheet extends StatelessWidget {
  const _TerritoryBottomSheet({
    required this.territory,
    required this.onReassign,
  });

  final TerritoryWithCoverage territory;
  final VoidCallback onReassign;

  @override
  Widget build(BuildContext context) {
    final t = territory;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            t.territory.name,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          _InfoRow(label: 'Cobertura', value: '${t.coveragePercent.toStringAsFixed(0)}%'),
          _InfoRow(
            label: 'Voluntario asignado',
            value: t.assignedVolunteerName ?? 'Sin asignar',
          ),
          _InfoRow(label: 'Visitas completadas', value: '${t.visitsCompleted} / ${t.visitsTotal}'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton.icon(
              onPressed: onReassign,
              icon: const Icon(Icons.swap_horiz, size: 18),
              label: const Text('Reasignar voluntario'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 14, color: AppColors.subtleText),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Visit Bottom Sheet ────────────────────────────────────────────────────────

class _VisitBottomSheet extends StatelessWidget {
  const _VisitBottomSheet({required this.visit, this.onApprove});

  final MapVisitPin visit;
  final VoidCallback? onApprove;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  visit.contactName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
              ),
              _VisitResultChip(result: visit.result),
            ],
          ),
          const SizedBox(height: 12),
          _InfoRow(label: 'Voluntario', value: visit.volunteerName),
          _InfoRow(
            label: 'Registrado',
            value: _formatTime(visit.recordedAt),
          ),
          _InfoRow(
            label: 'Estado',
            value: switch (visit.status) {
              'approved' => 'Aprobado',
              'rejected' => 'Rechazado',
              _ => 'Pendiente de aprobación',
            },
          ),
          if (visit.notes != null && visit.notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                visit.notes!,
                style: const TextStyle(fontSize: 13, color: AppColors.onSurface),
              ),
            ),
          ],
          if (onApprove != null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton.icon(
                onPressed: onApprove,
                icon: const Icon(Icons.check, size: 18),
                label: const Text('Aprobar visita'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    return 'hace ${diff.inDays} días';
  }
}

class _VisitResultChip extends StatelessWidget {
  const _VisitResultChip({required this.result});
  final VisitResult result;

  @override
  Widget build(BuildContext context) {
    final (label, color, bg) = switch (result) {
      VisitResult.contacted => ('Contactado', AppColors.success, const Color(0xFFEBFAF1)),
      VisitResult.notHome => ('No estaba', AppColors.subtleText, AppColors.surfaceVariant),
      VisitResult.refused => ('Rechazó', AppColors.error, const Color(0xFFFDECEE)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
