/// Visita de canvassing realizada por un voluntario.
/// Puede crearse offline y sincronizarse después.
class CanvassVisit {
  const CanvassVisit({
    required this.id,
    required this.contactId,
    required this.campaignId,
    required this.volunteerId,
    required this.visitResult,
    required this.scriptCompleted,
    required this.wantsToVolunteer,
    required this.wantsToDonate,
    required this.wantsMoreInfo,
    required this.wantsYardSign,
    required this.requestedFollowup,
    required this.wasOffline,
    required this.status,
    required this.createdAt,
    this.resultNotes,
    this.sympathyLevel,
    this.voteIntention,
    this.persuadability,
    this.scriptId,
    this.scriptResponses,
    this.followupChannel,
    this.followupNotes,
    this.bestContactTime,
    this.householdSize,
    this.householdVoters,
    this.geoLat,
    this.geoLng,
    this.geoAccuracy,
  });

  final String id;
  final String contactId;
  final String campaignId;
  final String volunteerId;

  /// Resultado de la visita: 'contacted' | 'not_home' | 'refused' | 'moved'.
  final String visitResult;
  final String? resultNotes;

  /// Nivel de simpatía 1–5.
  final int? sympathyLevel;

  /// Intención de voto: 'supporter' | 'opponent' | 'undecided' | 'unknown'.
  final String? voteIntention;

  /// Persuasibilidad: 'high' | 'medium' | 'low'.
  final String? persuadability;

  final String? scriptId;
  final Map<String, dynamic>? scriptResponses;
  final bool scriptCompleted;

  // Flags de interés
  final bool wantsToVolunteer;
  final bool wantsToDonate;
  final bool wantsMoreInfo;
  final bool wantsYardSign;
  final bool requestedFollowup;
  final String? followupChannel;
  final String? followupNotes;
  final String? bestContactTime;

  final int? householdSize;
  final int? householdVoters;

  /// True si la visita fue registrada sin conexión.
  final bool wasOffline;

  /// Estado del registro: 'submitted' | 'approved' | 'rejected'.
  final String status;
  final DateTime createdAt;

  // GPS al momento de la visita
  final double? geoLat;
  final double? geoLng;
  final double? geoAccuracy;

  factory CanvassVisit.fromJson(Map<String, dynamic> json) {
    return CanvassVisit(
      id: json['id'] as String,
      contactId: json['contact_id'] as String,
      campaignId: json['campaign_id'] as String,
      volunteerId: json['volunteer_id'] as String,
      visitResult: json['visit_result'] as String,
      resultNotes: json['result_notes'] as String?,
      sympathyLevel: json['sympathy_level'] as int?,
      voteIntention: json['vote_intention'] as String?,
      persuadability: json['persuadability'] as String?,
      scriptId: json['script_id'] as String?,
      scriptResponses: json['script_responses'] as Map<String, dynamic>?,
      scriptCompleted: (json['script_completed'] as bool?) ?? false,
      wantsToVolunteer: (json['wants_to_volunteer'] as bool?) ?? false,
      wantsToDonate: (json['wants_to_donate'] as bool?) ?? false,
      wantsMoreInfo: (json['wants_more_info'] as bool?) ?? false,
      wantsYardSign: (json['wants_yard_sign'] as bool?) ?? false,
      requestedFollowup: (json['requested_followup'] as bool?) ?? false,
      followupChannel: json['followup_channel'] as String?,
      followupNotes: json['followup_notes'] as String?,
      bestContactTime: json['best_contact_time'] as String?,
      householdSize: json['household_size'] as int?,
      householdVoters: json['household_voters'] as int?,
      wasOffline: (json['was_offline'] as bool?) ?? false,
      status: json['status'] as String? ?? 'submitted',
      createdAt: DateTime.parse(json['created_at'] as String),
      geoLat: (json['geo_lat'] as num?)?.toDouble(),
      geoLng: (json['geo_lng'] as num?)?.toDouble(),
      geoAccuracy: (json['geo_accuracy'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'contact_id': contactId,
        'campaign_id': campaignId,
        'volunteer_id': volunteerId,
        'visit_result': visitResult,
        'result_notes': resultNotes,
        'sympathy_level': sympathyLevel,
        'vote_intention': voteIntention,
        'persuadability': persuadability,
        'script_id': scriptId,
        'script_responses': scriptResponses,
        'script_completed': scriptCompleted,
        'wants_to_volunteer': wantsToVolunteer,
        'wants_to_donate': wantsToDonate,
        'wants_more_info': wantsMoreInfo,
        'wants_yard_sign': wantsYardSign,
        'requested_followup': requestedFollowup,
        'followup_channel': followupChannel,
        'followup_notes': followupNotes,
        'best_contact_time': bestContactTime,
        'household_size': householdSize,
        'household_voters': householdVoters,
        'was_offline': wasOffline,
        'status': status,
        'created_at': createdAt.toIso8601String(),
        'geo_lat': geoLat,
        'geo_lng': geoLng,
        'geo_accuracy': geoAccuracy,
      };

  CanvassVisit copyWith({
    String? id,
    String? contactId,
    String? campaignId,
    String? volunteerId,
    String? visitResult,
    String? resultNotes,
    int? sympathyLevel,
    String? voteIntention,
    String? persuadability,
    String? scriptId,
    Map<String, dynamic>? scriptResponses,
    bool? scriptCompleted,
    bool? wantsToVolunteer,
    bool? wantsToDonate,
    bool? wantsMoreInfo,
    bool? wantsYardSign,
    bool? requestedFollowup,
    String? followupChannel,
    String? followupNotes,
    String? bestContactTime,
    int? householdSize,
    int? householdVoters,
    bool? wasOffline,
    String? status,
    DateTime? createdAt,
    double? geoLat,
    double? geoLng,
    double? geoAccuracy,
  }) {
    return CanvassVisit(
      id: id ?? this.id,
      contactId: contactId ?? this.contactId,
      campaignId: campaignId ?? this.campaignId,
      volunteerId: volunteerId ?? this.volunteerId,
      visitResult: visitResult ?? this.visitResult,
      resultNotes: resultNotes ?? this.resultNotes,
      sympathyLevel: sympathyLevel ?? this.sympathyLevel,
      voteIntention: voteIntention ?? this.voteIntention,
      persuadability: persuadability ?? this.persuadability,
      scriptId: scriptId ?? this.scriptId,
      scriptResponses: scriptResponses ?? this.scriptResponses,
      scriptCompleted: scriptCompleted ?? this.scriptCompleted,
      wantsToVolunteer: wantsToVolunteer ?? this.wantsToVolunteer,
      wantsToDonate: wantsToDonate ?? this.wantsToDonate,
      wantsMoreInfo: wantsMoreInfo ?? this.wantsMoreInfo,
      wantsYardSign: wantsYardSign ?? this.wantsYardSign,
      requestedFollowup: requestedFollowup ?? this.requestedFollowup,
      followupChannel: followupChannel ?? this.followupChannel,
      followupNotes: followupNotes ?? this.followupNotes,
      bestContactTime: bestContactTime ?? this.bestContactTime,
      householdSize: householdSize ?? this.householdSize,
      householdVoters: householdVoters ?? this.householdVoters,
      wasOffline: wasOffline ?? this.wasOffline,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      geoLat: geoLat ?? this.geoLat,
      geoLng: geoLng ?? this.geoLng,
      geoAccuracy: geoAccuracy ?? this.geoAccuracy,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CanvassVisit &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'CanvassVisit(id: $id, contactId: $contactId, result: $visitResult)';
}
