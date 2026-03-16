/// Configuración estática de la app. Los valores se inyectan en tiempo de
/// compilación via `--dart-define` o `--dart-define-from-file`.
///
/// Uso en CI/CD o local:
/// ```bash
/// flutter run \
///   --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
///   --dart-define=SUPABASE_ANON=eyJhbGc...
/// ```
abstract final class AppConfig {
  /// URL del proyecto Supabase.
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://hugufyyhiiqwbxvxbinm.supabase.co',
  );

  /// Clave anónima pública de Supabase.
  static const supabaseAnon = String.fromEnvironment(
    'SUPABASE_ANON',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1Z3VmeXloaWlxd2J4dnhiaW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzY4MjksImV4cCI6MjA4ODUxMjgyOX0.GzZb9vDgepUFUDrE0N6pALHNqHWvpGhhmhSfdlcD1Mo',
  );

  /// Activa logs adicionales en modo debug.
  static const isDebug = bool.fromEnvironment(
    'IS_DEBUG',
    defaultValue: true,
  );

  /// Nombre de la app para mostrar en UI.
  static const appName = 'CivicOS';

  /// Versión del app para mostrar en configuración.
  static const appVersion = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: '1.0.0',
  );
}
