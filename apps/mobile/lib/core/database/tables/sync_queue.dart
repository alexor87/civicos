import 'package:drift/drift.dart';

/// Cola de operaciones pendientes de sincronizar con el servidor.
/// Se procesa en orden FIFO cuando hay conexión disponible.
class SyncQueue extends Table {
  @override
  String get tableName => 'sync_queue';

  /// UUID generado localmente por el dispositivo.
  TextColumn get id => text()();

  /// Nombre de la entidad: 'canvass_visit' | 'contact' | etc.
  TextColumn get entityType => text().named('entity_type')();

  /// Operación: 'create' | 'update' | 'delete'
  TextColumn get operation => text()();

  /// Payload JSON serializado como texto.
  TextColumn get payload => text()();

  DateTimeColumn get createdAtLocal =>
      dateTime().named('created_at_local').withDefault(currentDateAndTime)();

  /// Número de intentos de sincronización fallidos.
  IntColumn get attempts =>
      integer().withDefault(const Constant(0))();

  /// Estado: 'pending' | 'syncing' | 'synced' | 'failed'
  TextColumn get status =>
      text().withDefault(const Constant('pending'))();

  TextColumn get errorMessage =>
      text().named('error_message').nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
