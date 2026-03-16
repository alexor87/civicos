/// Resumen de actividad de un voluntario. Usado por el Coordinador de Campo
/// en su pantalla de equipo.
class VolunteerSummary {
  const VolunteerSummary({
    required this.id,
    required this.fullName,
    required this.visitsCompleted,
    required this.visitsAssigned,
    required this.activityStatus,
    this.avatarUrl,
    this.territoryName,
    this.lastActivityAt,
  });

  final String id;
  final String fullName;
  final String? avatarUrl;
  final String? territoryName;
  final int visitsCompleted;
  final int visitsAssigned;
  final DateTime? lastActivityAt;

  /// Estado de actividad: 'active' | 'inactive' | 'offline'.
  final String activityStatus;

  /// Porcentaje de progreso (0–100).
  double get progressPercent =>
      visitsAssigned == 0 ? 0 : (visitsCompleted / visitsAssigned * 100).clamp(0, 100);

  factory VolunteerSummary.fromJson(Map<String, dynamic> json) {
    return VolunteerSummary(
      id: json['id'] as String,
      fullName: json['full_name'] as String,
      avatarUrl: json['avatar_url'] as String?,
      territoryName: json['territory_name'] as String?,
      visitsCompleted: (json['visits_completed'] as int?) ?? 0,
      visitsAssigned: (json['visits_assigned'] as int?) ?? 0,
      lastActivityAt: json['last_activity_at'] != null
          ? DateTime.parse(json['last_activity_at'] as String)
          : null,
      activityStatus: json['activity_status'] as String? ?? 'inactive',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'full_name': fullName,
        'avatar_url': avatarUrl,
        'territory_name': territoryName,
        'visits_completed': visitsCompleted,
        'visits_assigned': visitsAssigned,
        'last_activity_at': lastActivityAt?.toIso8601String(),
        'activity_status': activityStatus,
      };

  VolunteerSummary copyWith({
    String? id,
    String? fullName,
    String? avatarUrl,
    String? territoryName,
    int? visitsCompleted,
    int? visitsAssigned,
    DateTime? lastActivityAt,
    String? activityStatus,
  }) {
    return VolunteerSummary(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      territoryName: territoryName ?? this.territoryName,
      visitsCompleted: visitsCompleted ?? this.visitsCompleted,
      visitsAssigned: visitsAssigned ?? this.visitsAssigned,
      lastActivityAt: lastActivityAt ?? this.lastActivityAt,
      activityStatus: activityStatus ?? this.activityStatus,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is VolunteerSummary &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'VolunteerSummary(id: $id, fullName: $fullName, status: $activityStatus)';
}
