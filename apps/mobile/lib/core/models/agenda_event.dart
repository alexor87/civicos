/// Evento de la agenda de campaña.
class AgendaEvent {
  const AgendaEvent({
    required this.id,
    required this.campaignId,
    required this.title,
    required this.eventType,
    required this.startAt,
    this.endAt,
    this.location,
    this.notes,
  });

  final String id;
  final String campaignId;
  final String title;

  /// Tipo de evento: 'meeting' | 'rally' | 'training' | 'canvass' | etc.
  final String eventType;

  final DateTime startAt;
  final DateTime? endAt;
  final String? location;
  final String? notes;

  bool get isAllDay => endAt == null;

  /// Duración del evento (null si no tiene endAt).
  Duration? get duration =>
      endAt != null ? endAt!.difference(startAt) : null;

  factory AgendaEvent.fromJson(Map<String, dynamic> json) {
    return AgendaEvent(
      id: json['id'] as String,
      campaignId: json['campaign_id'] as String,
      title: json['title'] as String,
      eventType: json['event_type'] as String,
      startAt: DateTime.parse(json['start_at'] as String),
      endAt: json['end_at'] != null
          ? DateTime.parse(json['end_at'] as String)
          : null,
      location: json['location'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'campaign_id': campaignId,
        'title': title,
        'event_type': eventType,
        'start_at': startAt.toIso8601String(),
        'end_at': endAt?.toIso8601String(),
        'location': location,
        'notes': notes,
      };

  AgendaEvent copyWith({
    String? id,
    String? campaignId,
    String? title,
    String? eventType,
    DateTime? startAt,
    DateTime? endAt,
    String? location,
    String? notes,
  }) {
    return AgendaEvent(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      title: title ?? this.title,
      eventType: eventType ?? this.eventType,
      startAt: startAt ?? this.startAt,
      endAt: endAt ?? this.endAt,
      location: location ?? this.location,
      notes: notes ?? this.notes,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AgendaEvent &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'AgendaEvent(id: $id, title: $title, startAt: $startAt)';
}
