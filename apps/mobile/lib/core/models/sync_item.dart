/// Operaciones disponibles en la cola de sincronización.
enum SyncOperation {
  create,
  update,
  delete;

  String toJson() => name;

  static SyncOperation fromJson(String value) => switch (value) {
        'create' => SyncOperation.create,
        'update' => SyncOperation.update,
        'delete' => SyncOperation.delete,
        _ => SyncOperation.create,
      };
}

/// Estado de un item en la cola de sincronización.
enum SyncStatus {
  pending,
  syncing,
  synced,
  failed;

  String toJson() => name;

  static SyncStatus fromJson(String value) => switch (value) {
        'pending' => SyncStatus.pending,
        'syncing' => SyncStatus.syncing,
        'synced' => SyncStatus.synced,
        'failed' => SyncStatus.failed,
        _ => SyncStatus.pending,
      };
}

/// Item en la cola de sincronización offline→server.
/// Cada operación que el usuario realiza offline se encola aquí
/// y se procesa cuando recupera conexión.
class SyncItem {
  const SyncItem({
    required this.id,
    required this.entityType,
    required this.operation,
    required this.payload,
    required this.createdAtLocal,
    required this.attempts,
    required this.status,
    this.errorMessage,
  });

  /// UUID local generado por el dispositivo.
  final String id;

  /// Nombre de la entidad: 'canvass_visit' | 'contact' | etc.
  final String entityType;

  final SyncOperation operation;

  /// Payload completo para enviar al servidor (JSON serializable).
  final Map<String, dynamic> payload;

  final DateTime createdAtLocal;

  /// Número de intentos de sync fallidos.
  final int attempts;

  final SyncStatus status;
  final String? errorMessage;

  bool get isPending => status == SyncStatus.pending;
  bool get hasFailed => status == SyncStatus.failed;
  bool get isSynced => status == SyncStatus.synced;

  factory SyncItem.fromJson(Map<String, dynamic> json) {
    return SyncItem(
      id: json['id'] as String,
      entityType: json['entity_type'] as String,
      operation: SyncOperation.fromJson(json['operation'] as String),
      payload: json['payload'] as Map<String, dynamic>,
      createdAtLocal: DateTime.parse(json['created_at_local'] as String),
      attempts: (json['attempts'] as int?) ?? 0,
      status: SyncStatus.fromJson(json['status'] as String? ?? 'pending'),
      errorMessage: json['error_message'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'entity_type': entityType,
        'operation': operation.toJson(),
        'payload': payload,
        'created_at_local': createdAtLocal.toIso8601String(),
        'attempts': attempts,
        'status': status.toJson(),
        'error_message': errorMessage,
      };

  SyncItem copyWith({
    String? id,
    String? entityType,
    SyncOperation? operation,
    Map<String, dynamic>? payload,
    DateTime? createdAtLocal,
    int? attempts,
    SyncStatus? status,
    String? errorMessage,
  }) {
    return SyncItem(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      createdAtLocal: createdAtLocal ?? this.createdAtLocal,
      attempts: attempts ?? this.attempts,
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SyncItem && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'SyncItem(id: $id, entity: $entityType, op: $operation, status: $status)';
}
