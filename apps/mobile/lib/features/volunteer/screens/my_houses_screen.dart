import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../viewmodels/my_houses_viewmodel.dart';
import '../widgets/contact_list_tile.dart';

/// Pantalla de lista de contactos asignados al voluntario.
///
/// "Mis Casas" — cada fila es un destino de visita de campo.
class MyHousesScreen extends ConsumerStatefulWidget {
  const MyHousesScreen({super.key});

  static const routePath = '/volunteer/houses';

  @override
  ConsumerState<MyHousesScreen> createState() => _MyHousesScreenState();
}

class _MyHousesScreenState extends ConsumerState<MyHousesScreen> {
  final _searchController = TextEditingController();
  bool _showSearch = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(myHousesNotifierProvider);
    final notifier = ref.read(myHousesNotifierProvider.notifier);
    final filtered = state.filtered;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: _showSearch
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: AppTypography.bodyVolunteer,
                decoration: InputDecoration(
                  hintText: 'Buscar por nombre o dirección…',
                  hintStyle: AppTypography.body.copyWith(
                    color: AppColors.placeholderText,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                onChanged: notifier.search,
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Mis Casas'),
                  const SizedBox(width: 8),
                  if (state.pendingCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.warning,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${state.pendingCount}',
                        style: AppTypography.caption.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                ],
              ),
        actions: [
          // Ícono sync
          IconButton(
            onPressed: () => notifier.refresh(),
            icon: state.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  )
                : const Icon(Icons.sync),
            tooltip: 'Actualizar',
          ),
          // Ícono búsqueda
          IconButton(
            onPressed: () {
              setState(() {
                _showSearch = !_showSearch;
                if (!_showSearch) {
                  _searchController.clear();
                  notifier.search('');
                }
              });
            },
            icon: Icon(
              _showSearch ? Icons.close : Icons.search,
            ),
            tooltip: _showSearch ? 'Cerrar búsqueda' : 'Buscar',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: notifier.refresh,
        color: AppColors.primary,
        child: Column(
          children: [
            // ── Chips de filtro ───────────────────────────────────────────
            Container(
              color: AppColors.surface,
              padding: const EdgeInsets.fromLTRB(16, 8, 0, 12),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: HousesFilter.values.map((filter) {
                    final isSelected = state.filter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(filter.label),
                        selected: isSelected,
                        onSelected: (_) => notifier.setFilter(filter),
                        selectedColor: AppColors.primaryLight,
                        checkmarkColor: AppColors.primary,
                        labelStyle: AppTypography.label.copyWith(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.onSurface,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                        side: BorderSide(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.border,
                          width: isSelected ? 1.5 : 1,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            const Divider(height: 1),

            // ── Lista de contactos ────────────────────────────────────────
            Expanded(
              child: filtered.isEmpty
                  ? _EmptyState(filter: state.filter)
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final contact = filtered[index];
                        return ContactListTile(
                          contact: contact,
                          onTap: () => context.go(
                            '/volunteer/visit/${contact.id}',
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.filter});

  final HousesFilter filter;

  String get _message {
    switch (filter) {
      case HousesFilter.all:
        return 'No tienes casas asignadas aún.\nContacta a tu coordinador.';
      case HousesFilter.pending:
        return '¡No hay casas pendientes!\nYa completaste todas.';
      case HousesFilter.completed:
        return 'Aún no has completado\nninguna visita.';
      case HousesFilter.notHome:
        return 'Nadie ha estado ausente.\n¡Excelente!';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.home_outlined,
              size: 72,
              color: AppColors.border,
            ),
            const SizedBox(height: 20),
            Text(
              _message,
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
