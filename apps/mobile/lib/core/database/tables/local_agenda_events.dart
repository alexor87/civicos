import 'package:drift/drift.dart';

/// Eventos de la agenda de campaña descargados para acceso offline.
class LocalAgendaEvents extends Table {
  @override
  String get tableName => 'local_agenda_events';

  TextColumn get id => text()();
  TextColumn get campaignId => text().named('campaign_id')();
  TextColumn get title => text()();

  /// Tipo: 'meeting' | 'rally' | 'training' | 'canvass' | etc.
  TextColumn get eventType => text().named('event_type')();

  DateTimeColumn get startAt => dateTime().named('start_at')();
  DateTimeColumn get endAt => dateTime().named('end_at').nullable()();
  TextColumn get location => text().nullable()();
  TextColumn get notes => text().nullable()();

  DateTimeColumn get syncedAt =>
      dateTime().named('synced_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
