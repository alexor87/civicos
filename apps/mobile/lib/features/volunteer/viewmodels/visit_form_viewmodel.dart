import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/models/contact.dart';

part 'visit_form_viewmodel.g.dart';

// ── Enums de dominio ──────────────────────────────────────────────────────────

enum VisitResult {
  contacted('contacted', 'Contactado', '✅', 'Hablé con el residente'),
  notHome('not_home', 'No estaba', '🏠', 'Nadie respondió'),
  refused('refused', 'Rechazó hablar', '🚫', 'No quiso atender'),
  moved('moved', 'Se mudó', '📦', 'Ya no vive aquí');

  const VisitResult(this.value, this.label, this.emoji, this.subtitle);
  final String value;
  final String label;
  final String emoji;
  final String subtitle;
}

enum VoteIntention {
  supporter('supporter', 'Nos votará'),
  opponent('opponent', 'No nos votará'),
  undecided('undecided', 'Indeciso'),
  unknown('unknown', 'Prefiere no decir');

  const VoteIntention(this.value, this.label);
  final String value;
  final String label;
}

// ── Datos del formulario ──────────────────────────────────────────────────────

class VisitFormData {
  const VisitFormData({
    this.result,
    this.sympathyLevel,
    this.voteIntention,
    this.scriptAnswers = const {},
    this.wantsToBeVolunteer = false,
    this.wantsToDonate = false,
    this.wantsMoreInfo = false,
    this.wantsPoster = false,
    this.needsFollowUp = false,
    this.notes = '',
  });

  final VisitResult? result;
  final int? sympathyLevel;
  final VoteIntention? voteIntention;
  final Map<String, String> scriptAnswers;
  final bool wantsToBeVolunteer;
  final bool wantsToDonate;
  final bool wantsMoreInfo;
  final bool wantsPoster;
  final bool needsFollowUp;
  final String notes;

  bool get hasAnyData =>
      result != null ||
      sympathyLevel != null ||
      voteIntention != null ||
      scriptAnswers.isNotEmpty ||
      wantsToBeVolunteer ||
      wantsToDonate ||
      wantsMoreInfo ||
      wantsPoster ||
      needsFollowUp ||
      notes.isNotEmpty;

  VisitFormData copyWith({
    VisitResult? result,
    int? sympathyLevel,
    VoteIntention? voteIntention,
    Map<String, String>? scriptAnswers,
    bool? wantsToBeVolunteer,
    bool? wantsToDonate,
    bool? wantsMoreInfo,
    bool? wantsPoster,
    bool? needsFollowUp,
    String? notes,
  }) {
    return VisitFormData(
      result: result ?? this.result,
      sympathyLevel: sympathyLevel ?? this.sympathyLevel,
      voteIntention: voteIntention ?? this.voteIntention,
      scriptAnswers: scriptAnswers ?? this.scriptAnswers,
      wantsToBeVolunteer: wantsToBeVolunteer ?? this.wantsToBeVolunteer,
      wantsToDonate: wantsToDonate ?? this.wantsToDonate,
      wantsMoreInfo: wantsMoreInfo ?? this.wantsMoreInfo,
      wantsPoster: wantsPoster ?? this.wantsPoster,
      needsFollowUp: needsFollowUp ?? this.needsFollowUp,
      notes: notes ?? this.notes,
    );
  }
}

// ── Estado del formulario ─────────────────────────────────────────────────────

class VisitFormState {
  const VisitFormState({
    required this.contact,
    this.currentStep = 0,
    this.formData = const VisitFormData(),
    this.isSaving = false,
    this.savedOffline = false,
    this.saveSuccess = false,
  });

  final Contact contact;
  final int currentStep;
  final VisitFormData formData;
  final bool isSaving;
  final bool savedOffline;
  final bool saveSuccess;

  /// Número total de pasos visibles según el resultado seleccionado.
  int get totalSteps {
    if (formData.result == null) return 7;
    if (formData.result == VisitResult.contacted) return 7;
    // Para not_home, refused, moved: solo el paso de resultado + confirmación.
    return 2;
  }

  bool get canGoBack => currentStep > 0;
  bool get isLastStep => currentStep >= totalSteps - 1;

  VisitFormState copyWith({
    Contact? contact,
    int? currentStep,
    VisitFormData? formData,
    bool? isSaving,
    bool? savedOffline,
    bool? saveSuccess,
  }) {
    return VisitFormState(
      contact: contact ?? this.contact,
      currentStep: currentStep ?? this.currentStep,
      formData: formData ?? this.formData,
      isSaving: isSaving ?? this.isSaving,
      savedOffline: savedOffline ?? this.savedOffline,
      saveSuccess: saveSuccess ?? this.saveSuccess,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class VisitFormNotifier extends _$VisitFormNotifier {
  @override
  VisitFormState build(Contact contact) {
    return VisitFormState(contact: contact);
  }

  /// Avanza al siguiente paso.
  void nextStep() {
    if (state.currentStep < state.totalSteps - 1) {
      state = state.copyWith(currentStep: state.currentStep + 1);
    }
  }

  /// Retrocede al paso anterior.
  void previousStep() {
    if (state.currentStep > 0) {
      state = state.copyWith(currentStep: state.currentStep - 1);
    }
  }

  /// Navega directamente a un paso (para confirmación).
  void goToStep(int step) {
    state = state.copyWith(currentStep: step.clamp(0, state.totalSteps - 1));
  }

  /// Actualiza el resultado de la visita.
  void setResult(VisitResult result) {
    state = state.copyWith(
      formData: state.formData.copyWith(result: result),
    );
  }

  /// Actualiza el nivel de simpatía (1–5).
  void setSympathyLevel(int level) {
    state = state.copyWith(
      formData: state.formData.copyWith(sympathyLevel: level),
    );
  }

  /// Actualiza la intención de voto.
  void setVoteIntention(VoteIntention intention) {
    state = state.copyWith(
      formData: state.formData.copyWith(voteIntention: intention),
    );
  }

  /// Guarda una respuesta del script de campaña.
  void setScriptAnswer(String questionId, String answer) {
    final updated = Map<String, String>.from(state.formData.scriptAnswers)
      ..[questionId] = answer;
    state = state.copyWith(
      formData: state.formData.copyWith(scriptAnswers: updated),
    );
  }

  /// Actualiza las acciones de seguimiento.
  void updateFollowUp({
    bool? wantsToBeVolunteer,
    bool? wantsToDonate,
    bool? wantsMoreInfo,
    bool? wantsPoster,
    bool? needsFollowUp,
  }) {
    state = state.copyWith(
      formData: state.formData.copyWith(
        wantsToBeVolunteer: wantsToBeVolunteer,
        wantsToDonate: wantsToDonate,
        wantsMoreInfo: wantsMoreInfo,
        wantsPoster: wantsPoster,
        needsFollowUp: needsFollowUp,
      ),
    );
  }

  /// Actualiza las notas libres.
  void setNotes(String notes) {
    state = state.copyWith(
      formData: state.formData.copyWith(notes: notes),
    );
  }

  /// Guarda la visita. Si hay conectividad → Supabase; si no → Drift local.
  Future<void> saveVisit({bool isOnline = true}) async {
    state = state.copyWith(isSaving: true);

    try {
      // Simula latencia de red / escritura en DB.
      await Future<void>.delayed(
        Duration(milliseconds: isOnline ? 1200 : 300),
      );

      if (isOnline) {
        // En producción: await visitRepository.createVisit(state.contact.id, state.formData);
        state = state.copyWith(
          isSaving: false,
          saveSuccess: true,
          savedOffline: false,
        );
      } else {
        // En producción: await localDb.savePendingVisit(state.contact.id, state.formData);
        state = state.copyWith(
          isSaving: false,
          saveSuccess: true,
          savedOffline: true,
        );
      }
    } catch (_) {
      // Fallback: guardar offline siempre.
      state = state.copyWith(
        isSaving: false,
        saveSuccess: true,
        savedOffline: true,
      );
    }
  }
}
