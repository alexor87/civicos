import 'package:drift/drift.dart';

/// Tabla que almacena el perfil del usuario autenticado actualmente.
/// Contiene sólo una fila (la sesión activa).
class LocalUserProfile extends Table {
  @override
  String get tableName => 'local_user_profile';

  TextColumn get id => text()();
  TextColumn get tenantId => text().named('tenant_id')();
  TextColumn get fullName => text().named('full_name')();
  TextColumn get email => text()();

  /// Rol canónico: 'volunteer' | 'field_coordinator' | …
  TextColumn get role => text()();
  TextColumn get campaignId => text().named('campaign_id')();
  TextColumn get campaignName => text().named('campaign_name').withDefault(const Constant(''))();
  TextColumn get avatarUrl => text().named('avatar_url').nullable()();
  TextColumn get phone => text().nullable()();
  TextColumn get territoryId => text().named('territory_id').nullable()();

  /// Timestamp de la última autenticación exitosa.
  DateTimeColumn get lastAuthAt =>
      dateTime().named('last_auth_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
