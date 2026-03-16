import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../viewmodels/approvals_viewmodel.dart';

/// Card de visita pendiente de aprobación con botones Aprobar / Rechazar.
class ApprovalCard extends StatelessWidget {
  const ApprovalCard({
    super.key,
    required this.approval,
    required this.onApprove,
    required this.onReject,
    this.isProcessing = false,
  });

  final PendingApproval approval;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final bool isProcessing;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        approval.contactName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                    ),
                    _ResultChip(result: approval.visitResult),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: AppColors.subtleText),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        approval.address,
                        style: const TextStyle(fontSize: 13, color: AppColors.subtleText),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.person_outline, size: 13, color: AppColors.subtleText),
                    const SizedBox(width: 3),
                    Text(
                      approval.volunteerName,
                      style: const TextStyle(fontSize: 13, color: AppColors.subtleText),
                    ),
                    const SizedBox(width: 10),
                    const Icon(Icons.access_time, size: 13, color: AppColors.subtleText),
                    const SizedBox(width: 3),
                    Text(
                      _timeAgo(approval.registeredAt),
                      style: const TextStyle(fontSize: 13, color: AppColors.subtleText),
                    ),
                  ],
                ),
                if (approval.notes != null && approval.notes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      approval.notes!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.onSurface,
                        fontStyle: FontStyle.italic,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          // Botones
          isProcessing
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                )
              : Row(
                  children: [
                    Expanded(
                      child: TextButton.icon(
                        onPressed: onReject,
                        icon: const Icon(Icons.close, size: 16, color: AppColors.error),
                        label: const Text(
                          'Rechazar',
                          style: TextStyle(color: AppColors.error, fontSize: 14),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    Container(width: 1, height: 40, color: AppColors.border),
                    Expanded(
                      child: TextButton.icon(
                        onPressed: onApprove,
                        icon: const Icon(Icons.check, size: 16, color: AppColors.success),
                        label: const Text(
                          'Aprobar',
                          style: TextStyle(color: AppColors.success, fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    return 'hace ${diff.inDays} días';
  }
}

class _ResultChip extends StatelessWidget {
  const _ResultChip({required this.result});
  final String result;

  @override
  Widget build(BuildContext context) {
    final (label, color, bg) = switch (result) {
      'contacted' => ('Contactado', AppColors.success, const Color(0xFFEBFAF1)),
      'not_home' => ('No estaba', AppColors.subtleText, AppColors.surfaceVariant),
      'refused' => ('Rechazó', AppColors.error, const Color(0xFFFDECEE)),
      'moved' => ('Se mudó', AppColors.warning, const Color(0xFFFFF8EC)),
      _ => (result, AppColors.subtleText, AppColors.surfaceVariant),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

// ── Reject Dialog ─────────────────────────────────────────────────────────────

class RejectDialog extends StatefulWidget {
  const RejectDialog({super.key, required this.contactName});

  final String contactName;

  static Future<String?> show(BuildContext context, {required String contactName}) {
    return showDialog<String>(
      context: context,
      builder: (_) => RejectDialog(contactName: contactName),
    );
  }

  @override
  State<RejectDialog> createState() => _RejectDialogState();
}

class _RejectDialogState extends State<RejectDialog> {
  final _controller = TextEditingController();
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() => _hasText = _controller.text.trim().isNotEmpty);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      title: const Text('Rechazar registro', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Indica el motivo del rechazo del registro de ${widget.contactName}.',
            style: const TextStyle(fontSize: 14, color: AppColors.subtleText),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Escribe el motivo...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: _hasText ? () => Navigator.pop(context, _controller.text.trim()) : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.error,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Rechazar'),
        ),
      ],
    );
  }
}
