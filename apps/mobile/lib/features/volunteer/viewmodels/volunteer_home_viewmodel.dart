import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'volunteer_home_viewmodel.g.dart';

// ── Models ────────────────────────────────────────────────────────────────────

class CoordinatorMessage {
  const CoordinatorMessage({
    required this.id,
    required this.title,
    required this.body,
    required this.sentAt,
    this.isRead = false,
  });

  final String id;
  final String title;
  final String body;
  final DateTime sentAt;
  final bool isRead;
}

class VolunteerHomeState {
  const VolunteerHomeState({
    required this.volunteerName,
    required this.totalHouses,
    required this.contacted,
    required this.notHome,
    required this.refused,
    required this.pending,
    required this.messages,
    this.isOnline = true,
    this.isSyncing = false,
    this.lastSyncAt,
  });

  final String volunteerName;
  final int totalHouses;
  final int contacted;
  final int notHome;
  final int refused;
  final int pending;
  final List<CoordinatorMessage> messages;
  final bool isOnline;
  final bool isSyncing;
  final DateTime? lastSyncAt;

  /// Progreso del día: casas visitadas / total (0.0 – 1.0).
  double get progress {
    if (totalHouses == 0) return 0;
    final visited = contacted + notHome + refused;
    return (visited / totalHouses).clamp(0.0, 1.0);
  }

  bool get isComplete => progress >= 1.0;

  VolunteerHomeState copyWith({
    String? volunteerName,
    int? totalHouses,
    int? contacted,
    int? notHome,
    int? refused,
    int? pending,
    List<CoordinatorMessage>? messages,
    bool? isOnline,
    bool? isSyncing,
    DateTime? lastSyncAt,
  }) {
    return VolunteerHomeState(
      volunteerName: volunteerName ?? this.volunteerName,
      totalHouses: totalHouses ?? this.totalHouses,
      contacted: contacted ?? this.contacted,
      notHome: notHome ?? this.notHome,
      refused: refused ?? this.refused,
      pending: pending ?? this.pending,
      messages: messages ?? this.messages,
      isOnline: isOnline ?? this.isOnline,
      isSyncing: isSyncing ?? this.isSyncing,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class VolunteerHomeNotifier extends _$VolunteerHomeNotifier {
  @override
  VolunteerHomeState build() {
    // Estado inicial con datos de ejemplo para el prototipo.
    // En producción se cargaría desde Supabase / cache local Drift.
    return VolunteerHomeState(
      volunteerName: 'Carlos',
      totalHouses: 30,
      contacted: 8,
      notHome: 3,
      refused: 1,
      pending: 18,
      lastSyncAt: DateTime.now().subtract(const Duration(minutes: 12)),
      messages: [
        CoordinatorMessage(
          id: '1',
          title: 'Prioridad zona norte',
          body: 'Enfócate en el sector Las Palmas hoy.',
          sentAt: DateTime.now().subtract(const Duration(hours: 1)),
          isRead: false,
        ),
        CoordinatorMessage(
          id: '2',
          title: 'Material listo',
          body: 'Puedes recoger los volantes en la sede.',
          sentAt: DateTime.now().subtract(const Duration(hours: 3)),
          isRead: true,
        ),
        CoordinatorMessage(
          id: '3',
          title: 'Reunión hoy',
          body: 'Nos reunimos a las 6pm en la sede central.',
          sentAt: DateTime.now().subtract(const Duration(hours: 5)),
          isRead: true,
        ),
      ],
    );
  }

  /// Lanza una sincronización manual con el servidor.
  Future<void> syncNow() async {
    state = state.copyWith(isSyncing: true);
    // Simula la llamada al backend. En producción: await repository.sync()
    await Future<void>.delayed(const Duration(seconds: 2));
    state = state.copyWith(
      isSyncing: false,
      lastSyncAt: DateTime.now(),
    );
  }

  /// Marca un mensaje del coordinador como leído.
  void markMessageRead(String messageId) {
    final updated = state.messages.map((m) {
      return m.id == messageId ? CoordinatorMessage(
        id: m.id,
        title: m.title,
        body: m.body,
        sentAt: m.sentAt,
        isRead: true,
      ) : m;
    }).toList();
    state = state.copyWith(messages: updated);
  }

  /// Actualiza el estado de conectividad.
  void setOnline(bool isOnline) {
    state = state.copyWith(isOnline: isOnline);
  }
}
