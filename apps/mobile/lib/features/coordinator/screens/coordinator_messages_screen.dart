import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/volunteer_summary.dart';
import '../../../core/theme/app_colors.dart';
import '../viewmodels/team_viewmodel.dart';
import '../widgets/coordinator_broadcast_field.dart';

/// Pantalla de mensajes del coordinador: Tab Equipo + Tab Broadcast.
class CoordinatorMessagesScreen extends ConsumerStatefulWidget {
  const CoordinatorMessagesScreen({super.key});

  @override
  ConsumerState<CoordinatorMessagesScreen> createState() =>
      _CoordinatorMessagesScreenState();
}

class _CoordinatorMessagesScreenState
    extends ConsumerState<CoordinatorMessagesScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Mensajes',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.subtleText,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Equipo'),
            Tab(text: 'Broadcast'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _TeamTab(),
          _BroadcastTab(),
        ],
      ),
    );
  }
}

// ── Tab Equipo ────────────────────────────────────────────────────────────────

class _TeamTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(teamNotifierProvider);

    if (state.volunteers.isEmpty) {
      return const Center(
        child: Text(
          'No hay voluntarios en tu equipo',
          style: TextStyle(color: AppColors.subtleText, fontSize: 15),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: state.volunteers.length,
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 72, color: AppColors.border),
      itemBuilder: (context, index) {
        final volunteer = state.volunteers[index];
        return _VolunteerMessageRow(
          volunteer: volunteer,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => _ChatScreen(volunteer: volunteer),
            ),
          ),
        );
      },
    );
  }
}

class _VolunteerMessageRow extends StatelessWidget {
  const _VolunteerMessageRow({
    required this.volunteer,
    required this.onTap,
  });

  final VolunteerSummary volunteer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (volunteer.activityStatus) {
      'active' => AppColors.success,
      'inactive' => AppColors.warning,
      _ => AppColors.border,
    };

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primaryLight,
            child: Text(
              volunteer.fullName.isNotEmpty ? volunteer.fullName[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 17,
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: statusColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
          ),
        ],
      ),
      title: Text(
        volunteer.fullName,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppColors.onSurface,
        ),
      ),
      subtitle: Text(
        volunteer.territoryName ?? 'Sin territorio asignado',
        style: const TextStyle(fontSize: 13, color: AppColors.subtleText),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppColors.border),
    );
  }
}

// ── Chat Screen ───────────────────────────────────────────────────────────────

class _ChatScreen extends ConsumerStatefulWidget {
  const _ChatScreen({required this.volunteer});
  final VolunteerSummary volunteer;

  @override
  ConsumerState<_ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<_ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [
    ChatMessage(
      id: 'm1',
      text: 'Buenos días! ¿Cómo va el sector hoy?',
      sentAt: DateTime.now().subtract(const Duration(hours: 2)),
      isFromCoordinator: true,
    ),
    ChatMessage(
      id: 'm2',
      text: 'Todo bien, hay bastante receptividad en esta manzana.',
      sentAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 55)),
      isFromCoordinator: false,
      senderName: 'Carlos',
    ),
    ChatMessage(
      id: 'm3',
      text: 'Perfecto. Recuerda priorizar los apartamentos del bloque B.',
      sentAt: DateTime.now().subtract(const Duration(hours: 1)),
      isFromCoordinator: true,
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: text,
        sentAt: DateTime.now(),
        isFromCoordinator: true,
      ));
    });
    _controller.clear();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.volunteer.fullName,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            Text(
              widget.volunteer.territoryName ?? '',
              style: const TextStyle(fontSize: 12, color: AppColors.subtleText),
            ),
          ],
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
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (_, i) => _ChatBubble(message: _messages[i]),
            ),
          ),
          _ChatInputBar(
            controller: _controller,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});
  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isCoord = message.isFromCoordinator;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Align(
        alignment: isCoord ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.72,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isCoord ? AppColors.primary : AppColors.surface,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(16),
              topRight: const Radius.circular(16),
              bottomLeft: Radius.circular(isCoord ? 16 : 4),
              bottomRight: Radius.circular(isCoord ? 4 : 16),
            ),
            border: isCoord ? null : Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                message.text,
                style: TextStyle(
                  fontSize: 14,
                  color: isCoord ? Colors.white : AppColors.onSurface,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _formatTime(message.sentAt),
                style: TextStyle(
                  fontSize: 11,
                  color: isCoord ? Colors.white70 : AppColors.subtleText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class _ChatInputBar extends StatelessWidget {
  const _ChatInputBar({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: EdgeInsets.fromLTRB(
        12,
        10,
        12,
        MediaQuery.of(context).viewInsets.bottom + 12,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                hintText: 'Escribe un mensaje...',
                hintStyle: const TextStyle(color: AppColors.placeholderText),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
              onSubmitted: (_) => onSend(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onSend,
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tab Broadcast ─────────────────────────────────────────────────────────────

class _BroadcastTab extends ConsumerStatefulWidget {
  @override
  ConsumerState<_BroadcastTab> createState() => _BroadcastTabState();
}

class _BroadcastTabState extends ConsumerState<_BroadcastTab> {
  final List<_BroadcastRecord> _history = [
    _BroadcastRecord(
      text: 'Prioridad zona norte. Enfócate en el sector Las Palmas hoy.',
      sentAt: DateTime.now().subtract(const Duration(hours: 1)),
    ),
    _BroadcastRecord(
      text: 'Material listo. Pueden recoger los volantes en la sede.',
      sentAt: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    _BroadcastRecord(
      text: 'Reunión hoy a las 6pm en la sede central. Asistencia obligatoria.',
      sentAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        CoordinatorBroadcastField(
          onSend: (text) async {
            await ref.read(teamNotifierProvider.notifier).sendMessage('all', text);
            setState(() {
              _history.insert(0, _BroadcastRecord(text: text, sentAt: DateTime.now()));
            });
          },
        ),
        const SizedBox(height: 20),
        if (_history.isNotEmpty) ...[
          const Text(
            'Mensajes anteriores',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.subtleText,
            ),
          ),
          const SizedBox(height: 10),
          ..._history.map((b) => _BroadcastHistoryCard(record: b)),
        ],
      ],
    );
  }
}

class _BroadcastRecord {
  const _BroadcastRecord({required this.text, required this.sentAt});
  final String text;
  final DateTime sentAt;
}

class _BroadcastHistoryCard extends StatelessWidget {
  const _BroadcastHistoryCard({required this.record});
  final _BroadcastRecord record;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.broadcast_on_personal, size: 14, color: AppColors.primary),
              const SizedBox(width: 6),
              const Text(
                'Enviado al equipo',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
              const Spacer(),
              Text(
                _formatTime(record.sentAt),
                style: const TextStyle(fontSize: 11, color: AppColors.subtleText),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            record.text,
            style: const TextStyle(fontSize: 14, color: AppColors.onSurface),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    return 'hace ${diff.inDays} días';
  }
}
