import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../viewmodels/approvals_viewmodel.dart';
import '../widgets/approval_card.dart';

/// Cola de registros de visita pendientes de aprobación del coordinador.
class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(approvalsNotifierProvider);
    final notifier = ref.read(approvalsNotifierProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Aprobaciones',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: Column(
        children: [
          // ── Header de conteo ─────────────────────────────────────────────────
          _ApprovalsHeader(pendingCount: state.pendingCount),

          // ── Tabs de filtro ───────────────────────────────────────────────────
          _FilterTabs(
            current: state.filter,
            onChanged: notifier.setFilter,
          ),

          // ── Lista ────────────────────────────────────────────────────────────
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: notifier.refresh,
                    color: AppColors.primary,
                    child: state.filteredApprovals.isEmpty
                        ? const _EmptyApprovals()
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                            itemCount: state.filteredApprovals.length,
                            itemBuilder: (context, index) {
                              final approval = state.filteredApprovals[index];
                              return ApprovalCard(
                                approval: approval,
                                isProcessing: state.processingId == approval.id,
                                onApprove: () => _handleApprove(context, ref, approval),
                                onReject: () => _handleReject(context, ref, approval),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleApprove(
    BuildContext context,
    WidgetRef ref,
    PendingApproval approval,
  ) async {
    await ref.read(approvalsNotifierProvider.notifier).approve(approval.id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text('Visita de ${approval.contactName} aprobada'),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  Future<void> _handleReject(
    BuildContext context,
    WidgetRef ref,
    PendingApproval approval,
  ) async {
    final reason = await RejectDialog.show(context, contactName: approval.contactName);
    if (reason != null && reason.isNotEmpty) {
      await ref.read(approvalsNotifierProvider.notifier).reject(approval.id, reason);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registro de ${approval.contactName} rechazado'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _ApprovalsHeader extends StatelessWidget {
  const _ApprovalsHeader({required this.pendingCount});
  final int pendingCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: pendingCount == 0 ? AppColors.fieldGreenLight : const Color(0xFFFDECEE),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Icon(
                  pendingCount == 0 ? Icons.check_circle : Icons.pending_actions,
                  size: 16,
                  color: pendingCount == 0 ? AppColors.success : AppColors.error,
                ),
                const SizedBox(width: 6),
                Text(
                  pendingCount == 0
                      ? 'Todo al día'
                      : '$pendingCount aprobación${pendingCount == 1 ? '' : 'es'} pendiente${pendingCount == 1 ? '' : 's'}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: pendingCount == 0 ? AppColors.success : AppColors.error,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────

class _FilterTabs extends StatelessWidget {
  const _FilterTabs({required this.current, required this.onChanged});

  final ApprovalFilter current;
  final void Function(ApprovalFilter) onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          _Tab(
            label: 'Todos',
            isSelected: current == ApprovalFilter.all,
            onTap: () => onChanged(ApprovalFilter.all),
          ),
          const SizedBox(width: 8),
          _Tab(
            label: 'Hoy',
            isSelected: current == ApprovalFilter.today,
            onTap: () => onChanged(ApprovalFilter.today),
          ),
          const SizedBox(width: 8),
          _Tab(
            label: 'Esta semana',
            isSelected: current == ApprovalFilter.thisWeek,
            onTap: () => onChanged(ApprovalFilter.thisWeek),
          ),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.subtleText,
          ),
        ),
      ),
    );
  }
}

// ── Empty State ───────────────────────────────────────────────────────────────

class _EmptyApprovals extends StatelessWidget {
  const _EmptyApprovals();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SizedBox(height: 80),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle_outline,
                size: 72,
                color: AppColors.success,
              ),
              SizedBox(height: 16),
              Text(
                'Todo al día.',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface,
                ),
              ),
              SizedBox(height: 6),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 48),
                child: Text(
                  'No hay aprobaciones pendientes en este período.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.subtleText,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
