import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'approvals_viewmodel.g.dart';

// ── Models ────────────────────────────────────────────────────────────────────

enum ApprovalFilter { all, today, thisWeek }

class PendingApproval {
  const PendingApproval({
    required this.id,
    required this.contactName,
    required this.address,
    required this.visitResult,
    required this.volunteerName,
    required this.registeredAt,
    this.notes,
  });

  final String id;
  final String contactName;
  final String address;

  /// Resultado: 'contacted' | 'not_home' | 'refused' | 'moved'.
  final String visitResult;
  final String volunteerName;
  final DateTime registeredAt;
  final String? notes;
}

class ApprovalsState {
  const ApprovalsState({
    required this.pendingApprovals,
    required this.filter,
    this.isLoading = false,
    this.processingId,
  });

  final List<PendingApproval> pendingApprovals;
  final ApprovalFilter filter;
  final bool isLoading;

  /// ID del registro siendo procesado (para mostrar loading en el card).
  final String? processingId;

  int get pendingCount => pendingApprovals.length;

  List<PendingApproval> get filteredApprovals {
    final now = DateTime.now();
    return switch (filter) {
      ApprovalFilter.all => pendingApprovals,
      ApprovalFilter.today => pendingApprovals.where((a) {
          final d = a.registeredAt;
          return d.year == now.year && d.month == now.month && d.day == now.day;
        }).toList(),
      ApprovalFilter.thisWeek => pendingApprovals.where((a) {
          final diff = now.difference(a.registeredAt).inDays;
          return diff <= 7;
        }).toList(),
    };
  }

  ApprovalsState copyWith({
    List<PendingApproval>? pendingApprovals,
    ApprovalFilter? filter,
    bool? isLoading,
    String? processingId,
    bool clearProcessing = false,
  }) {
    return ApprovalsState(
      pendingApprovals: pendingApprovals ?? this.pendingApprovals,
      filter: filter ?? this.filter,
      isLoading: isLoading ?? this.isLoading,
      processingId: clearProcessing ? null : processingId ?? this.processingId,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class ApprovalsNotifier extends _$ApprovalsNotifier {
  @override
  ApprovalsState build() {
    return ApprovalsState(
      filter: ApprovalFilter.all,
      pendingApprovals: [
        PendingApproval(
          id: 'ap1',
          contactName: 'Roberto Gómez',
          address: 'Calle 45 # 23-10, Apto 302',
          visitResult: 'contacted',
          volunteerName: 'Carlos Mendoza',
          registeredAt: DateTime.now().subtract(const Duration(minutes: 15)),
          notes: 'Muy receptivo, pidió más información sobre el programa de vivienda.',
        ),
        PendingApproval(
          id: 'ap2',
          contactName: 'Gloria Estrada',
          address: 'Carrera 12 # 56-78',
          visitResult: 'contacted',
          volunteerName: 'Ana Martínez',
          registeredAt: DateTime.now().subtract(const Duration(minutes: 50)),
        ),
        PendingApproval(
          id: 'ap3',
          contactName: 'Pedro Vargas',
          address: 'Avenida 30 # 45-12',
          visitResult: 'refused',
          volunteerName: 'Luis Pérez',
          registeredAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 10)),
          notes: 'No quiso hablar, cerró la puerta.',
        ),
        PendingApproval(
          id: 'ap4',
          contactName: 'Lucía Ramos',
          address: 'Calle 78 # 12-34',
          visitResult: 'not_home',
          volunteerName: 'Carlos Mendoza',
          registeredAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        PendingApproval(
          id: 'ap5',
          contactName: 'Miguel Ángel Flores',
          address: 'Carrera 5 # 89-01',
          visitResult: 'contacted',
          volunteerName: 'Jorge Ramírez',
          registeredAt: DateTime.now().subtract(const Duration(days: 1, hours: 3)),
          notes: 'Simpatizante confirmado, quiere poner cartel.',
        ),
      ],
    );
  }

  Future<void> approve(String id) async {
    state = state.copyWith(processingId: id);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final updated = state.pendingApprovals.where((a) => a.id != id).toList();
    state = state.copyWith(
      pendingApprovals: updated,
      clearProcessing: true,
    );
  }

  Future<void> reject(String id, String reason) async {
    state = state.copyWith(processingId: id);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final updated = state.pendingApprovals.where((a) => a.id != id).toList();
    state = state.copyWith(
      pendingApprovals: updated,
      clearProcessing: true,
    );
  }

  void setFilter(ApprovalFilter filter) {
    state = state.copyWith(filter: filter);
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true);
    await Future<void>.delayed(const Duration(seconds: 1));
    state = state.copyWith(isLoading: false);
  }
}
