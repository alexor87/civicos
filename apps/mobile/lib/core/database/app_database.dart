import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'daos/contacts_dao.dart';
import 'daos/visits_dao.dart';
import 'daos/sync_dao.dart';
import 'tables/local_contacts.dart';
import 'tables/local_canvass_visits.dart';
import 'tables/local_territories.dart';
import 'tables/sync_queue.dart';
import 'tables/local_agenda_events.dart';
import 'tables/local_notifications.dart';
import 'tables/local_user_profile.dart';

export 'tables/local_contacts.dart';
export 'tables/local_canvass_visits.dart';
export 'tables/local_territories.dart';
export 'tables/sync_queue.dart';
export 'tables/local_agenda_events.dart';
export 'tables/local_notifications.dart';
export 'tables/local_user_profile.dart';
export 'daos/contacts_dao.dart';
export 'daos/visits_dao.dart';
export 'daos/sync_dao.dart';

part 'app_database.g.dart';

/// Base de datos local SQLite gestionada por Drift.
///
/// Versión del esquema: 1 (MVP Fase 1)
/// Máximo offline: 72h Voluntario, 4h Coordinador.
@DriftDatabase(
  tables: [
    LocalUserProfile,
    LocalContacts,
    LocalCanvassVisits,
    LocalTerritories,
    SyncQueue,
    LocalAgendaEvents,
    LocalNotifications,
  ],
  daos: [
    ContactsDao,
    VisitsDao,
    SyncDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          // Futuras migraciones aquí.
        },
      );

  static QueryExecutor _openConnection() {
    return driftDatabase(name: 'civicos_local');
  }
}
