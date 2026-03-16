/// Contacto / ciudadano en el territorio del voluntario.
/// Mapeado 1:1 con la tabla `contacts` de Supabase y
/// `local_contacts` en Drift.
class Contact {
  const Contact({
    required this.id,
    required this.tenantId,
    required this.campaignId,
    required this.fullName,
    required this.address,
    required this.syncedAt,
    this.phone,
    this.neighborhood,
    this.geoLat,
    this.geoLng,
    this.sympathyLevel,
    this.voteIntention,
    this.lastVisitResult,
    this.lastVisitAt,
    this.notes,
  });

  final String id;
  final String tenantId;
  final String campaignId;
  final String fullName;
  final String? phone;
  final String address;
  final String? neighborhood;
  final double? geoLat;
  final double? geoLng;

  /// Nivel de simpatía 1–5 (1 = muy negativo, 5 = muy positivo).
  final int? sympathyLevel;

  /// Intención de voto: 'supporter' | 'opponent' | 'undecided' | 'unknown'.
  final String? voteIntention;

  /// Resultado de la última visita: 'contacted' | 'not_home' | 'refused' | 'moved'.
  final String? lastVisitResult;
  final DateTime? lastVisitAt;
  final String? notes;

  /// Timestamp de la última sincronización con el servidor.
  final DateTime syncedAt;

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      campaignId: json['campaign_id'] as String,
      fullName: json['full_name'] as String,
      phone: json['phone'] as String?,
      address: json['address'] as String,
      neighborhood: json['neighborhood'] as String?,
      geoLat: (json['geo_lat'] as num?)?.toDouble(),
      geoLng: (json['geo_lng'] as num?)?.toDouble(),
      sympathyLevel: json['sympathy_level'] as int?,
      voteIntention: json['vote_intention'] as String?,
      lastVisitResult: json['last_visit_result'] as String?,
      lastVisitAt: json['last_visit_at'] != null
          ? DateTime.parse(json['last_visit_at'] as String)
          : null,
      notes: json['notes'] as String?,
      syncedAt: json['synced_at'] != null
          ? DateTime.parse(json['synced_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tenant_id': tenantId,
        'campaign_id': campaignId,
        'full_name': fullName,
        'phone': phone,
        'address': address,
        'neighborhood': neighborhood,
        'geo_lat': geoLat,
        'geo_lng': geoLng,
        'sympathy_level': sympathyLevel,
        'vote_intention': voteIntention,
        'last_visit_result': lastVisitResult,
        'last_visit_at': lastVisitAt?.toIso8601String(),
        'notes': notes,
        'synced_at': syncedAt.toIso8601String(),
      };

  Contact copyWith({
    String? id,
    String? tenantId,
    String? campaignId,
    String? fullName,
    String? phone,
    String? address,
    String? neighborhood,
    double? geoLat,
    double? geoLng,
    int? sympathyLevel,
    String? voteIntention,
    String? lastVisitResult,
    DateTime? lastVisitAt,
    String? notes,
    DateTime? syncedAt,
  }) {
    return Contact(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      campaignId: campaignId ?? this.campaignId,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      neighborhood: neighborhood ?? this.neighborhood,
      geoLat: geoLat ?? this.geoLat,
      geoLng: geoLng ?? this.geoLng,
      sympathyLevel: sympathyLevel ?? this.sympathyLevel,
      voteIntention: voteIntention ?? this.voteIntention,
      lastVisitResult: lastVisitResult ?? this.lastVisitResult,
      lastVisitAt: lastVisitAt ?? this.lastVisitAt,
      notes: notes ?? this.notes,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Contact && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Contact(id: $id, fullName: $fullName)';
}
