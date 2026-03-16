/// Roles de usuario en CivicOS.
/// Fase MVP soporta [volunteer] y [fieldCoordinator].
enum AppRole {
  volunteer,
  fieldCoordinator,
  campaignManager,
  candidate,
  analyst,
  commsCoordinator,
  superAdmin,
  unknown;

  /// Convierte el string que viene del JWT de Supabase al enum.
  static AppRole fromString(String role) => switch (role) {
        'volunteer' => AppRole.volunteer,
        'field_coordinator' => AppRole.fieldCoordinator,
        'campaign_manager' => AppRole.campaignManager,
        'candidate' => AppRole.candidate,
        'analyst' => AppRole.analyst,
        'comms_coordinator' => AppRole.commsCoordinator,
        'super_admin' => AppRole.superAdmin,
        _ => AppRole.unknown,
      };

  /// String canónico para enviar a Supabase o comparar con el JWT.
  String toRoleString() => switch (this) {
        AppRole.volunteer => 'volunteer',
        AppRole.fieldCoordinator => 'field_coordinator',
        AppRole.campaignManager => 'campaign_manager',
        AppRole.candidate => 'candidate',
        AppRole.analyst => 'analyst',
        AppRole.commsCoordinator => 'comms_coordinator',
        AppRole.superAdmin => 'super_admin',
        AppRole.unknown => 'unknown',
      };

  /// Indica si el rol tiene acceso a la app móvil.
  bool get isMobileSupported => switch (this) {
        AppRole.volunteer => true,
        AppRole.fieldCoordinator => true,
        AppRole.campaignManager => true,
        AppRole.candidate => true,
        AppRole.analyst => true,
        AppRole.commsCoordinator => true,
        _ => false,
      };

  /// Texto legible para mostrar en UI.
  String get displayName => switch (this) {
        AppRole.volunteer => 'Voluntario',
        AppRole.fieldCoordinator => 'Coordinador de Campo',
        AppRole.campaignManager => 'Gerente de Campaña',
        AppRole.candidate => 'Candidato',
        AppRole.analyst => 'Analista',
        AppRole.commsCoordinator => 'Coordinador de Comunicaciones',
        AppRole.superAdmin => 'Super Admin',
        AppRole.unknown => 'Desconocido',
      };
}
