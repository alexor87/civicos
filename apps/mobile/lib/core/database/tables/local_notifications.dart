import 'package:drift/drift.dart';

/// Notificaciones recientes recibidas vía FCM o Supabase Realtime.
/// Se almacenan localmente para mostrar incluso sin conexión.
class LocalNotifications extends Table {
  @override
  String get tableName => 'local_notifications';

  TextColumn get id => text()();
  TextColumn get campaignId => text().named('campaign_id').nullable()();
  TextColumn get title => text()();
  TextColumn get body => text()();

  /// Tipo: 'alert' | 'info' | 'approval' | 'message' | etc.
  TextColumn get notificationType =>
      text().named('notification_type').withDefault(const Constant('info'))();

  BoolColumn get isRead =>
      boolean().named('is_read').withDefault(const Constant(false))();

  /// Datos adicionales en JSON (ej: entityId, entityType).
  TextColumn get payload => text().nullable()();

  DateTimeColumn get receivedAt =>
      dateTime().named('received_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
