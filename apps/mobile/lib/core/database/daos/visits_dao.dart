import 'package:drift/drift.dart';

import '../app_database.dart';

part 'visits_dao.g.dart';

/// DAO para operaciones CRUD sobre [LocalCanvassVisits].
@DriftAccessor(tables: [LocalCanvassVisits])
class VisitsDao extends DatabaseAccessor<AppDatabase> with _$VisitsDaoMixin {
  VisitsDao(super.db);

  /// Inserta una nueva visita y devuelve su ID.
  Future<String> insertVisit(LocalCanvassVisitsCompanion visit) async {
    await into(localCanvassVisits).insert(visit, mode: InsertMode.insertOrReplace);
    return visit.id.value;
  }

  /// Todas las visitas registradas para un contacto específico,
  /// ordenadas de más reciente a más antigua.
  Future<List<LocalCanvassVisit>> getVisitsForContact(
      String contactId) async {
    return (select(localCanvassVisits)
          ..where((v) => v.contactId.equals(contactId))
          ..orderBy([(v) => OrderingTerm.desc(v.createdAt)]))
        .get();
  }

  /// Visitas que aún no han sido enviadas al servidor
  /// (status = 'submitted' Y was_offline = true).
  Future<List<LocalCanvassVisit>> getPendingVisits() async {
    return (select(localCanvassVisits)
          ..where(
            (v) =>
                v.status.equals('submitted') &
                v.wasOffline.equals(true),
          )
          ..orderBy([(v) => OrderingTerm.asc(v.createdAt)]))
        .get();
  }

  /// Actualiza el estado de una visita (ej: 'submitted' → 'approved').
  Future<void> updateVisitStatus(String id, String status) async {
    await (update(localCanvassVisits)..where((v) => v.id.equals(id))).write(
      LocalCanvassVisitsCompanion(status: Value(status)),
    );
  }

  /// Cuenta visitas por estado para un voluntario.
  Future<Map<String, int>> countByStatus(String volunteerId) async {
    final rows = await (select(localCanvassVisits)
          ..where((v) => v.volunteerId.equals(volunteerId)))
        .get();
    final counts = <String, int>{};
    for (final row in rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  }

  /// Stream de visitas de hoy para un voluntario.
  Stream<List<LocalCanvassVisit>> watchTodayVisits(String volunteerId) {
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    return (select(localCanvassVisits)
          ..where(
            (v) =>
                v.volunteerId.equals(volunteerId) &
                v.createdAt.isBiggerOrEqualValue(startOfDay) &
                v.createdAt.isSmallerThanValue(endOfDay),
          )
          ..orderBy([(v) => OrderingTerm.desc(v.createdAt)]))
        .watch();
  }
}
