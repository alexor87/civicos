import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/contact.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../viewmodels/my_houses_viewmodel.dart';
import '../viewmodels/visit_form_viewmodel.dart';
import '../widgets/step_progress_bar.dart';
import '../widgets/sympathy_selector.dart';
import '../widgets/visit_result_card.dart';

/// Formulario de registro de visita — 7 pasos en un PageView.
///
/// El corazón de la app del voluntario. Diseñado para uso con una mano,
/// bajo luz solar y con conectividad intermitente.
///
/// Acepta [contactId] como parámetro de ruta (GoRouter) y resuelve el
/// [Contact] desde el estado local de [MyHousesNotifier].
class VisitFormScreen extends ConsumerStatefulWidget {
  const VisitFormScreen({
    super.key,
    required this.contactId,
  });

  static const routePath = '/volunteer/visit/:contactId';

  final String contactId;

  @override
  ConsumerState<VisitFormScreen> createState() => _VisitFormScreenState();
}

class _VisitFormScreenState extends ConsumerState<VisitFormScreen> {
  late final PageController _pageController;

  /// Contacto resuelto una sola vez al primer acceso y cacheado.
  Contact? _cachedContact;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  /// Resuelve el contacto desde la lista en memoria de [MyHousesNotifier].
  /// El resultado se cachea para que el proveedor de Riverpod reciba siempre
  /// la misma instancia y no recree el estado del formulario.
  Contact get _contact {
    if (_cachedContact != null) return _cachedContact!;
    final houses = ref.read(myHousesNotifierProvider);
    _cachedContact = houses.contacts.firstWhere(
      (c) => c.id == widget.contactId,
      orElse: () => Contact(
        id: widget.contactId,
        tenantId: '',
        campaignId: '',
        fullName: 'Contacto #${widget.contactId}',
        address: '—',
        syncedAt: DateTime.now(),
      ),
    );
    return _cachedContact!;
  }

  void _animateToPage(int page) {
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _onCancel() async {
    final state = ref.read(visitFormNotifierProvider(_contact));
    if (state.formData.hasAnyData) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('¿Cancelar visita?'),
          content: const Text(
            'Los datos ingresados no se guardarán. ¿Estás seguro?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Continuar'),
            ),
            TextButton(
              style: TextButton.styleFrom(
                foregroundColor: AppColors.error,
              ),
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Cancelar visita'),
            ),
          ],
        ),
      );
      if (confirmed == true && mounted) context.pop();
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = visitFormNotifierProvider(_contact);
    final state = ref.watch(provider);
    final notifier = ref.read(provider.notifier);

    // Cuando se guarda exitosamente, volvemos a la lista.
    ref.listen(provider, (prev, next) {
      if (next.saveSuccess && !next.isSaving) {
        _showSaveSuccessAndPop(next.savedOffline);
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          onPressed: _onCancel,
          icon: const Icon(Icons.close),
          tooltip: 'Cancelar',
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              state.contact.fullName,
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.w700,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              state.contact.address,
              style: AppTypography.caption,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // ── Barra de progreso de pasos ──────────────────────────────────
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: StepProgressBar(
              currentStep: state.currentStep,
              totalSteps: state.totalSteps,
            ),
          ),

          const Divider(height: 1),

          // ── Contenido del paso actual ───────────────────────────────────
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: _buildPages(state, notifier),
            ),
          ),

          // ── Navegación inferior ─────────────────────────────────────────
          _BottomNav(
            canGoBack: state.canGoBack,
            isLastStep: state.isLastStep,
            isSaving: state.isSaving,
            onBack: () {
              notifier.previousStep();
              _animateToPage(state.currentStep - 1);
            },
            onNext: () {
              notifier.nextStep();
              _animateToPage(state.currentStep + 1);
            },
            onSave: () => notifier.saveVisit(isOnline: true),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildPages(VisitFormState state, VisitFormNotifier notifier) {
    if (state.formData.result != null &&
        state.formData.result != VisitResult.contacted) {
      // Flujo corto para not_home / refused / moved
      return [
        _Step1Result(
          selectedResult: state.formData.result,
          onSelect: notifier.setResult,
        ),
        _Step7Confirmation(state: state),
      ];
    }

    return [
      _Step1Result(
        selectedResult: state.formData.result,
        onSelect: notifier.setResult,
      ),
      _Step2Sympathy(
        selectedLevel: state.formData.sympathyLevel,
        onSelect: notifier.setSympathyLevel,
      ),
      _Step3VoteIntention(
        selected: state.formData.voteIntention,
        onSelect: notifier.setVoteIntention,
      ),
      _Step4Script(
        answers: state.formData.scriptAnswers,
        onAnswer: notifier.setScriptAnswer,
        onSkip: () {
          notifier.goToStep(4);
          _animateToPage(4);
        },
      ),
      _Step5FollowUp(
        formData: state.formData,
        onChanged: notifier.updateFollowUp,
      ),
      _Step6Notes(
        notes: state.formData.notes,
        onChanged: notifier.setNotes,
      ),
      _Step7Confirmation(state: state),
    ];
  }

  void _showSaveSuccessAndPop(bool offline) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          offline
              ? 'Guardado localmente. Se sincronizará cuando haya conexión.'
              : 'Visita guardada correctamente.',
        ),
        backgroundColor:
            offline ? AppColors.warning : AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
    context.pop();
  }
}

// ── Paso 1: Resultado de la visita ────────────────────────────────────────────

class _Step1Result extends StatelessWidget {
  const _Step1Result({
    required this.selectedResult,
    required this.onSelect,
  });

  final VisitResult? selectedResult;
  final ValueChanged<VisitResult> onSelect;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Cuál fue el resultado de la visita?',
            style: AppTypography.headlineVolunteer,
          ),
          const SizedBox(height: 6),
          Text(
            'Selecciona la opción que mejor describe lo que ocurrió.',
            style: AppTypography.bodyVolunteer.copyWith(
              color: AppColors.subtleText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 24),
          ...VisitResult.values.map(
            (result) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: VisitResultCard(
                emoji: result.emoji,
                label: result.label,
                subtitle: result.subtitle,
                isSelected: selectedResult == result,
                onTap: () => onSelect(result),
                selectedColor: _colorForResult(result),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _colorForResult(VisitResult result) {
    switch (result) {
      case VisitResult.contacted:
        return AppColors.success;
      case VisitResult.notHome:
        return AppColors.notHome;
      case VisitResult.refused:
        return AppColors.error;
      case VisitResult.moved:
        return AppColors.warning;
    }
  }
}

// ── Paso 2: Nivel de simpatía ─────────────────────────────────────────────────

class _Step2Sympathy extends StatelessWidget {
  const _Step2Sympathy({
    required this.selectedLevel,
    required this.onSelect,
  });

  final int? selectedLevel;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: SympathySelector(
        selectedLevel: selectedLevel,
        onLevelSelected: onSelect,
      ),
    );
  }
}

// ── Paso 3: Intención de voto ─────────────────────────────────────────────────

class _Step3VoteIntention extends StatelessWidget {
  const _Step3VoteIntention({
    required this.selected,
    required this.onSelect,
  });

  final VoteIntention? selected;
  final ValueChanged<VoteIntention> onSelect;

  @override
  Widget build(BuildContext context) {
    const options = [
      (VoteIntention.supporter, '🗳️', AppColors.success),
      (VoteIntention.opponent, '🚫', AppColors.error),
      (VoteIntention.undecided, '🤔', AppColors.warning),
      (VoteIntention.unknown, '🤐', AppColors.subtleText),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Cuál es su intención de voto?',
            style: AppTypography.headlineVolunteer,
          ),
          const SizedBox(height: 6),
          Text(
            'Según lo que expresó el residente.',
            style: AppTypography.bodyVolunteer.copyWith(
              color: AppColors.subtleText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 24),
          ...options.map(
            (opt) {
              final (intention, emoji, color) = opt;
              final isSelected = selected == intention;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GestureDetector(
                  onTap: () => onSelect(intention),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? color.withAlpha(20)
                          : AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? color : AppColors.border,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(emoji,
                            style: const TextStyle(fontSize: 30)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            intention.label,
                            style: AppTypography.headlineVolunteer.copyWith(
                              color: isSelected
                                  ? color
                                  : AppColors.onSurface,
                            ),
                          ),
                        ),
                        if (isSelected)
                          Icon(Icons.check_circle,
                              color: color, size: 24),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ── Paso 4: Script de campaña ─────────────────────────────────────────────────

class _Step4Script extends StatelessWidget {
  const _Step4Script({
    required this.answers,
    required this.onAnswer,
    required this.onSkip,
  });

  final Map<String, String> answers;
  final void Function(String questionId, String answer) onAnswer;
  final VoidCallback onSkip;

  // Preguntas de ejemplo del script. En producción vendrían del backend.
  static const _questions = [
    (
      id: 'q1',
      question: '¿Cuál es el problema más importante de su barrio?',
      options: ['Seguridad', 'Infraestructura', 'Empleo', 'Salud', 'Otro'],
    ),
    (
      id: 'q2',
      question: '¿Cómo calificaría la gestión del alcalde actual?',
      options: ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Script de campaña',
                style: AppTypography.headlineVolunteer,
              ),
              TextButton(
                onPressed: onSkip,
                child: Text(
                  'Saltar script',
                  style: AppTypography.label.copyWith(
                    color: AppColors.subtleText,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Responde las preguntas de la campaña si el residente está dispuesto.',
            style: AppTypography.bodyVolunteer.copyWith(
              color: AppColors.subtleText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 24),
          ..._questions.map(
            (q) {
              final selectedAnswer = answers[q.id];
              return Padding(
                padding: const EdgeInsets.only(bottom: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        q.question,
                        style: AppTypography.bodyVolunteer.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryDark,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...q.options.map(
                      (opt) {
                        final isSelected = selectedAnswer == opt;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: GestureDetector(
                            onTap: () => onAnswer(q.id, opt),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 130),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primaryLight
                                    : AppColors.surface,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.border,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      opt,
                                      style:
                                          AppTypography.bodyVolunteer.copyWith(
                                        color: isSelected
                                            ? AppColors.primary
                                            : AppColors.onSurface,
                                        fontWeight: isSelected
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                  ),
                                  if (isSelected)
                                    const Icon(
                                      Icons.check_circle,
                                      color: AppColors.primary,
                                      size: 20,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ── Paso 5: Acciones de seguimiento ──────────────────────────────────────────

class _Step5FollowUp extends StatelessWidget {
  const _Step5FollowUp({
    required this.formData,
    required this.onChanged,
  });

  final VisitFormData formData;
  final void Function({
    bool? wantsToBeVolunteer,
    bool? wantsToDonate,
    bool? wantsMoreInfo,
    bool? wantsPoster,
    bool? needsFollowUp,
  }) onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Acciones de seguimiento',
            style: AppTypography.headlineVolunteer,
          ),
          const SizedBox(height: 6),
          Text(
            '¿Qué expresó el residente que quiere hacer?',
            style: AppTypography.bodyVolunteer.copyWith(
              color: AppColors.subtleText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 24),
          _BigCheckbox(
            emoji: '🙋',
            label: 'Quiere ser voluntario',
            value: formData.wantsToBeVolunteer,
            onChanged: (v) => onChanged(wantsToBeVolunteer: v),
          ),
          _BigCheckbox(
            emoji: '💰',
            label: 'Quiere donar',
            value: formData.wantsToDonate,
            onChanged: (v) => onChanged(wantsToDonate: v),
          ),
          _BigCheckbox(
            emoji: '📬',
            label: 'Quiere más información',
            value: formData.wantsMoreInfo,
            onChanged: (v) => onChanged(wantsMoreInfo: v),
          ),
          _BigCheckbox(
            emoji: '🪧',
            label: 'Quiere cartel/pendón',
            value: formData.wantsPoster,
            onChanged: (v) => onChanged(wantsPoster: v),
          ),
          _BigCheckbox(
            emoji: '🔔',
            label: 'Necesita seguimiento',
            value: formData.needsFollowUp,
            onChanged: (v) => onChanged(needsFollowUp: v),
          ),
        ],
      ),
    );
  }
}

class _BigCheckbox extends StatelessWidget {
  const _BigCheckbox({
    required this.emoji,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String emoji;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 130),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: value ? AppColors.primaryLight : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: value ? AppColors.primary : AppColors.border,
            width: value ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: AppTypography.bodyVolunteer.copyWith(
                  color:
                      value ? AppColors.primary : AppColors.onSurface,
                  fontWeight:
                      value ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 130),
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: value ? AppColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: value ? AppColors.primary : AppColors.border,
                  width: 2,
                ),
              ),
              child: value
                  ? const Icon(Icons.check, color: Colors.white, size: 18)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Paso 6: Notas ─────────────────────────────────────────────────────────────

class _Step6Notes extends StatefulWidget {
  const _Step6Notes({
    required this.notes,
    required this.onChanged,
  });

  final String notes;
  final ValueChanged<String> onChanged;

  @override
  State<_Step6Notes> createState() => _Step6NotesState();
}

class _Step6NotesState extends State<_Step6Notes> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.notes);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Notas adicionales',
                style: AppTypography.headlineVolunteer,
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Opcional',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.subtleText,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Observaciones sobre la visita o el contacto.',
            style: AppTypography.bodyVolunteer.copyWith(
              color: AppColors.subtleText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _ctrl,
            maxLines: 7,
            minLines: 5,
            style: AppTypography.bodyVolunteer,
            onChanged: widget.onChanged,
            decoration: InputDecoration(
              hintText:
                  'Ej: El señor mencionó interés en el tema de seguridad. Tiene familia con niños pequeños…',
              hintStyle: AppTypography.body.copyWith(
                color: AppColors.placeholderText,
              ),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          // Botón de nota de voz (placeholder)
          OutlinedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                      'Nota de voz próximamente disponible.'),
                ),
              );
            },
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 56),
              side: const BorderSide(color: AppColors.border),
              foregroundColor: AppColors.subtleText,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.mic_outlined, size: 22),
            label: Text(
              'Agregar nota de voz',
              style: AppTypography.label.copyWith(
                color: AppColors.subtleText,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Paso 7: Confirmación ──────────────────────────────────────────────────────

class _Step7Confirmation extends StatelessWidget {
  const _Step7Confirmation({required this.state});

  final VisitFormState state;

  @override
  Widget build(BuildContext context) {
    final data = state.formData;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Resumen de la visita',
            style: AppTypography.headlineVolunteer,
          ),
          const SizedBox(height: 6),
          Text(
            'Revisa la información antes de guardar.',
            style: AppTypography.bodyVolunteer.copyWith(
              color: AppColors.subtleText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 24),

          // Resumen
          _SummaryCard(
            items: [
              _SummaryItem(
                icon: Icons.flag_outlined,
                label: 'Resultado',
                value: data.result?.label ?? 'No especificado',
                color: _resultColor(data.result),
              ),
              if (data.sympathyLevel != null)
                _SummaryItem(
                  icon: Icons.sentiment_satisfied_outlined,
                  label: 'Simpatía',
                  value: '${data.sympathyLevel} / 5',
                  color: AppColors.primary,
                ),
              if (data.voteIntention != null)
                _SummaryItem(
                  icon: Icons.how_to_vote_outlined,
                  label: 'Intención de voto',
                  value: data.voteIntention!.label,
                  color: AppColors.primary,
                ),
              if (data.scriptAnswers.isNotEmpty)
                _SummaryItem(
                  icon: Icons.quiz_outlined,
                  label: 'Preguntas respondidas',
                  value: '${data.scriptAnswers.length}',
                  color: AppColors.info,
                ),
              if (data.notes.isNotEmpty)
                _SummaryItem(
                  icon: Icons.notes_outlined,
                  label: 'Notas',
                  value: data.notes.length > 60
                      ? '${data.notes.substring(0, 60)}…'
                      : data.notes,
                  color: AppColors.subtleText,
                ),
            ],
          ),

          // Acciones de seguimiento seleccionadas
          if (_hasFollowUp(data)) ...[
            const SizedBox(height: 16),
            Text('Seguimiento', style: AppTypography.headline),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (data.wantsToBeVolunteer)
                  _Tag(label: '🙋 Quiere ser voluntario'),
                if (data.wantsToDonate)
                  _Tag(label: '💰 Quiere donar'),
                if (data.wantsMoreInfo)
                  _Tag(label: '📬 Más información'),
                if (data.wantsPoster)
                  _Tag(label: '🪧 Quiere cartel'),
                if (data.needsFollowUp)
                  _Tag(label: '🔔 Seguimiento'),
              ],
            ),
          ],
        ],
      ),
    );
  }

  bool _hasFollowUp(VisitFormData data) =>
      data.wantsToBeVolunteer ||
      data.wantsToDonate ||
      data.wantsMoreInfo ||
      data.wantsPoster ||
      data.needsFollowUp;

  Color _resultColor(VisitResult? result) {
    switch (result) {
      case VisitResult.contacted:
        return AppColors.success;
      case VisitResult.notHome:
        return AppColors.notHome;
      case VisitResult.refused:
        return AppColors.error;
      case VisitResult.moved:
        return AppColors.warning;
      default:
        return AppColors.border;
    }
  }
}

class _SummaryItem {
  const _SummaryItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.items});

  final List<_SummaryItem> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final isLast = entry.key == items.length - 1;
          final item = entry.value;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(item.icon, color: item.color, size: 20),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.label,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.subtleText,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          item.value,
                          style: AppTypography.bodyVolunteer.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (!isLast) const Divider(height: 1),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withAlpha(80)),
      ),
      child: Text(
        label,
        style: AppTypography.label.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ── Navegación inferior (prev / next / guardar) ────────────────────────────────

class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.canGoBack,
    required this.isLastStep,
    required this.isSaving,
    required this.onBack,
    required this.onNext,
    required this.onSave,
  });

  final bool canGoBack;
  final bool isLastStep;
  final bool isSaving;
  final VoidCallback onBack;
  final VoidCallback onNext;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Row(
        children: [
          // Botón anterior
          if (canGoBack)
            Expanded(
              flex: 1,
              child: SizedBox(
                height: 60,
                child: OutlinedButton.icon(
                  onPressed: onBack,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    foregroundColor: AppColors.onSurface,
                  ),
                  icon: const Icon(Icons.arrow_back_ios, size: 18),
                  label: const Text('Anterior'),
                ),
              ),
            ),

          if (canGoBack) const SizedBox(width: 12),

          // Botón siguiente / guardar
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 60,
              child: ElevatedButton.icon(
                onPressed: isSaving ? null : (isLastStep ? onSave : onNext),
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isLastStep ? AppColors.fieldGreen : AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  textStyle: AppTypography.bodyVolunteer.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                icon: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Icon(
                        isLastStep
                            ? Icons.check_circle_outline
                            : Icons.arrow_forward_ios,
                        size: 20,
                      ),
                label: Text(
                  isSaving
                      ? 'Guardando…'
                      : isLastStep
                          ? 'Guardar visita'
                          : 'Siguiente',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
