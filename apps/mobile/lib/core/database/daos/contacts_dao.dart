import 'package:drift/drift.dart';

import '../app_database.dart';

part 'contacts_dao.g.dart';

/// DAO para operaciones CRUD sobre la tabla [LocalContacts].
@DriftAccessor(tables: [LocalContacts])
class ContactsDao extends DatabaseAccessor<AppDatabase>
    with _$ContactsDaoMixin {
  ContactsDao(super.db);

  /// Stream reactivo de todos los contactos de una campaña, ordenados
  /// por nombre completo.
  Stream<List<LocalContact>> getContactsByCampaign(String campaignId) {
    return (select(localContacts)
          ..where((c) => c.campaignId.equals(campaignId))
          ..orderBy([(c) => OrderingTerm.asc(c.fullName)]))
        .watch();
  }

  /// Obtiene un contacto por su ID. Devuelve null si no existe.
  Future<LocalContact?> getContact(String id) {
    return (select(localContacts)..where((c) => c.id.equals(id)))
        .getSingleOrNull();
  }

  /// Inserta o actualiza una lista de contactos en bloque.
  /// Usa [InsertMode.insertOrReplace] para manejar los upserts correctamente.
  Future<void> upsertContacts(List<LocalContactsCompanion> contacts) async {
    await batch((b) {
      b.insertAll(localContacts, contacts, mode: InsertMode.insertOrReplace);
    });
  }

  /// Busca contactos por nombre, dirección o colonia.
  Future<List<LocalContact>> searchContacts(
      String campaignId, String query) async {
    final pattern = '%${query.toLowerCase()}%';
    return (select(localContacts)
          ..where(
            (c) =>
                c.campaignId.equals(campaignId) &
                (c.fullName.lower().like(pattern) |
                    c.address.lower().like(pattern) |
                    c.neighborhood.lower().like(pattern)),
          )
          ..orderBy([(c) => OrderingTerm.asc(c.fullName)]))
        .get();
  }

  /// Cuenta los contactos sin visitar de una campaña.
  Future<int> countUnvisited(String campaignId) async {
    final count = localContacts.id.count();
    final query = selectOnly(localContacts)
      ..addColumns([count])
      ..where(
        localContacts.campaignId.equals(campaignId) &
            localContacts.lastVisitAt.isNull(),
      );
    final row = await query.getSingle();
    return row.read(count) ?? 0;
  }

  /// Elimina todos los contactos de una campaña (para re-sincronizar).
  Future<void> deleteAll(String campaignId) async {
    await (delete(localContacts)
          ..where((c) => c.campaignId.equals(campaignId)))
        .go();
  }

  /// Actualiza el resultado de la última visita directamente en el contacto.
  Future<void> updateLastVisit({
    required String contactId,
    required String visitResult,
    required int? sympathyLevel,
    required String? voteIntention,
    required DateTime visitAt,
  }) async {
    await (update(localContacts)..where((c) => c.id.equals(contactId))).write(
      LocalContactsCompanion(
        lastVisitResult: Value(visitResult),
        sympathyLevel: Value(sympathyLevel),
        voteIntention: Value(voteIntention),
        lastVisitAt: Value(visitAt),
      ),
    );
  }
}
