/// Territorio asignado. Incluye geometría GeoJSON para mostrarlo en el mapa.
class Territory {
  const Territory({
    required this.id,
    required this.campaignId,
    required this.name,
    required this.syncedAt,
    this.geometry,
    this.status,
    this.color,
    this.coveragePercent,
  });

  final String id;
  final String campaignId;
  final String name;

  /// GeoJSON como string (Feature o FeatureCollection).
  final String? geometry;

  /// Estado: 'active' | 'completed' | 'assigned' | etc.
  final String? status;

  /// Color hexadecimal para el mapa (ej: '#2262ec').
  final String? color;

  /// Porcentaje de cobertura 0–100.
  final double? coveragePercent;

  final DateTime syncedAt;

  factory Territory.fromJson(Map<String, dynamic> json) {
    return Territory(
      id: json['id'] as String,
      campaignId: json['campaign_id'] as String,
      name: json['name'] as String,
      geometry: json['geometry'] as String?,
      status: json['status'] as String?,
      color: json['color'] as String?,
      coveragePercent: (json['coverage_percent'] as num?)?.toDouble(),
      syncedAt: json['synced_at'] != null
          ? DateTime.parse(json['synced_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'campaign_id': campaignId,
        'name': name,
        'geometry': geometry,
        'status': status,
        'color': color,
        'coverage_percent': coveragePercent,
        'synced_at': syncedAt.toIso8601String(),
      };

  Territory copyWith({
    String? id,
    String? campaignId,
    String? name,
    String? geometry,
    String? status,
    String? color,
    double? coveragePercent,
    DateTime? syncedAt,
  }) {
    return Territory(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      name: name ?? this.name,
      geometry: geometry ?? this.geometry,
      status: status ?? this.status,
      color: color ?? this.color,
      coveragePercent: coveragePercent ?? this.coveragePercent,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Territory && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Territory(id: $id, name: $name, status: $status)';
}
