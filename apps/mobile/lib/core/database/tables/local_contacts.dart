import 'package:drift/drift.dart';

/// Contactos asignados al voluntario. Se descargan del servidor
/// durante la sincronización y se usan offline.
class LocalContacts extends Table {
  @override
  String get tableName => 'local_contacts';

  TextColumn get id => text()();
  TextColumn get tenantId => text().named('tenant_id')();
  TextColumn get campaignId => text().named('campaign_id')();
  TextColumn get fullName => text().named('full_name')();
  TextColumn get phone => text().nullable()();
  TextColumn get address => text()();
  TextColumn get neighborhood => text().nullable()();

  RealColumn get geoLat => real().named('geo_lat').nullable()();
  RealColumn get geoLng => real().named('geo_lng').nullable()();

  /// Nivel de simpatía 1–5.
  IntColumn get sympathyLevel => integer().named('sympathy_level').nullable()();

  /// Intención de voto: 'supporter' | 'opponent' | 'undecided' | 'unknown'.
  TextColumn get voteIntention => text().named('vote_intention').nullable()();

  /// Resultado de la última visita.
  TextColumn get lastVisitResult =>
      text().named('last_visit_result').nullable()();
  DateTimeColumn get lastVisitAt =>
      dateTime().named('last_visit_at').nullable()();
  TextColumn get notes => text().nullable()();

  DateTimeColumn get syncedAt =>
      dateTime().named('synced_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
