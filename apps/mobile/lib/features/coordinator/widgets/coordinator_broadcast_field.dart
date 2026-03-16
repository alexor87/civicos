import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Campo grande para escribir y enviar mensajes broadcast al equipo.
class CoordinatorBroadcastField extends StatefulWidget {
  const CoordinatorBroadcastField({
    super.key,
    required this.onSend,
    this.isLoading = false,
  });

  final Future<void> Function(String message) onSend;
  final bool isLoading;

  @override
  State<CoordinatorBroadcastField> createState() => _CoordinatorBroadcastFieldState();
}

class _CoordinatorBroadcastFieldState extends State<CoordinatorBroadcastField> {
  final _controller = TextEditingController();
  bool _hasText = false;
  bool _isSending = false;

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

  Future<void> _confirmAndSend() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text(
          'Enviar a todo el equipo',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'El siguiente mensaje será enviado a todos los voluntarios activos:',
              style: TextStyle(fontSize: 14, color: AppColors.subtleText),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                text,
                style: const TextStyle(fontSize: 14, color: AppColors.onSurface),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Enviar'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isSending = true);
      try {
        await widget.onSend(text);
        _controller.clear();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Mensaje enviado a todo el equipo'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isSending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _controller,
            maxLines: 5,
            minLines: 3,
            style: const TextStyle(fontSize: 15, color: AppColors.onSurface),
            decoration: const InputDecoration(
              hintText: 'Escribe un mensaje para todo tu equipo...',
              hintStyle: TextStyle(color: AppColors.placeholderText, fontSize: 15),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 46,
            child: ElevatedButton.icon(
              onPressed: _hasText && !_isSending ? _confirmAndSend : null,
              icon: _isSending
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.send_rounded, size: 18),
              label: Text(_isSending ? 'Enviando...' : 'Enviar a todo el equipo'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.border,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
