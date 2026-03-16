import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/models/contact.dart';

part 'my_houses_viewmodel.g.dart';

// ── Filtro ────────────────────────────────────────────────────────────────────

enum HousesFilter {
  all('Todos'),
  pending('Pendientes'),
  completed('Completados'),
  notHome('No estaban');

  const HousesFilter(this.label);
  final String label;
}

// ── Estado ────────────────────────────────────────────────────────────────────

class MyHousesState {
  const MyHousesState({
    required this.contacts,
    this.filter = HousesFilter.all,
    this.searchQuery = '',
    this.isLoading = false,
  });

  final List<Contact> contacts;
  final HousesFilter filter;
  final String searchQuery;
  final bool isLoading;

  /// Contactos filtrados por [filter] y [searchQuery].
  List<Contact> get filtered {
    var result = contacts;

    // Filtro por estado de visita.
    switch (filter) {
      case HousesFilter.all:
        break;
      case HousesFilter.pending:
        result = result
            .where((c) =>
                c.lastVisitResult == null || c.lastVisitResult == 'pending')
            .toList();
      case HousesFilter.completed:
        result = result
            .where((c) =>
                c.lastVisitResult == 'contacted' ||
                c.lastVisitResult == 'refused' ||
                c.lastVisitResult == 'moved')
            .toList();
      case HousesFilter.notHome:
        result =
            result.where((c) => c.lastVisitResult == 'not_home').toList();
    }

    // Filtro por búsqueda.
    if (searchQuery.trim().isNotEmpty) {
      final q = searchQuery.trim().toLowerCase();
      result = result
          .where((c) =>
              c.fullName.toLowerCase().contains(q) ||
              c.address.toLowerCase().contains(q))
          .toList();
    }

    return result;
  }

  /// Número de contactos pendientes de visita.
  int get pendingCount =>
      contacts.where((c) => c.lastVisitResult == null).length;

  MyHousesState copyWith({
    List<Contact>? contacts,
    HousesFilter? filter,
    String? searchQuery,
    bool? isLoading,
  }) {
    return MyHousesState(
      contacts: contacts ?? this.contacts,
      filter: filter ?? this.filter,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class MyHousesNotifier extends _$MyHousesNotifier {
  @override
  MyHousesState build() {
    // Datos de ejemplo. En producción: carga desde Drift DB local.
    return MyHousesState(
      contacts: _sampleContacts(),
    );
  }

  /// Cambia el filtro activo.
  void setFilter(HousesFilter filter) {
    state = state.copyWith(filter: filter);
  }

  /// Actualiza la búsqueda en tiempo real.
  void search(String query) {
    state = state.copyWith(searchQuery: query);
  }

  /// Recarga los contactos desde la DB local.
  Future<void> refresh() async {
    state = state.copyWith(isLoading: true);
    await Future<void>.delayed(const Duration(milliseconds: 500));
    state = state.copyWith(
      contacts: _sampleContacts(),
      isLoading: false,
    );
  }

  List<Contact> _sampleContacts() => [
        Contact(
          id: '1',
          tenantId: 't1',
          campaignId: 'c1',
          fullName: 'María Rodríguez',
          address: 'Cra 45 #23-10, Apto 301',
          neighborhood: 'Las Palmas',
          syncedAt: DateTime.now(),
          lastVisitResult: 'contacted',
          sympathyLevel: 4,
          voteIntention: 'supporter',
        ),
        Contact(
          id: '2',
          tenantId: 't1',
          campaignId: 'c1',
          fullName: 'Juan Carlos Peña',
          address: 'Cll 50 #12-45',
          neighborhood: 'El Poblado',
          syncedAt: DateTime.now(),
          lastVisitResult: 'not_home',
        ),
        Contact(
          id: '3',
          tenantId: 't1',
          campaignId: 'c1',
          fullName: 'Ana Lucía Torres',
          address: 'Av Laureles #80-20',
          neighborhood: 'Laureles',
          syncedAt: DateTime.now(),
        ),
        Contact(
          id: '4',
          tenantId: 't1',
          campaignId: 'c1',
          fullName: 'Pedro Gómez',
          address: 'Cra 80 #34-56',
          neighborhood: 'Robledo',
          syncedAt: DateTime.now(),
          lastVisitResult: 'refused',
        ),
        Contact(
          id: '5',
          tenantId: 't1',
          campaignId: 'c1',
          fullName: 'Sandra Milena López',
          address: 'Cll 10 #5-30, Casa 2',
          neighborhood: 'Belén',
          syncedAt: DateTime.now(),
        ),
        Contact(
          id: '6',
          tenantId: 't1',
          campaignId: 'c1',
          fullName: 'Fernando Ríos',
          address: 'Cra 65 #15-78',
          neighborhood: 'Castilla',
          syncedAt: DateTime.now(),
          lastVisitResult: 'contacted',
          sympathyLevel: 5,
          voteIntention: 'supporter',
        ),
      ];
}
