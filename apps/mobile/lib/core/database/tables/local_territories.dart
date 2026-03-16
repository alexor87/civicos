import 'package:drift/drift.dart';

/// Territorios asignados. El campo [geometry] almacena el GeoJSON
/// como texto para poder renderizarlo en flutter_map offline.
class LocalTerritories extends Table {
  @override
  String get tableName => 'local_territories';

  TextColumn get id => text()();
  TextColumn get campaignId => text().named('campaign_id')();
  TextColumn get name => text()();

  /// GeoJSON completo (Feature o FeatureCollection) como string.
  TextColumn get geometry => text().nullable()();

  /// Estado: 'active' | 'completed' | 'assigned'
  TextColumn get status => text().nullable()();

  /// Color hexadecimal para el mapa (ej: '#2262ec').
  TextColumn get color => text().nullable()();

  /// Porcentaje de cobertura 0.0–100.0.
  RealColumn get coveragePercent =>
      real().named('coverage_percent').nullable()();

  DateTimeColumn get syncedAt =>
      dateTime().named('synced_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
