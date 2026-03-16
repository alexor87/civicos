import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/app_config.dart';

/// Servicio de inicialización y acceso al cliente Supabase.
///
/// Uso:
/// ```dart
/// await SupabaseService.initialize();
/// final client = SupabaseService.client;
/// ```
abstract final class SupabaseService {
  /// Inicializa Supabase con las credenciales de [AppConfig].
  /// Debe llamarse en [main()] antes de [runApp].
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnon,
      debug: AppConfig.isDebug,
      realtimeClientOptions: const RealtimeClientOptions(
        logLevel: RealtimeLogLevel.info,
      ),
    );
  }

  /// Cliente Supabase listo para usar. Lanza si no se ha inicializado.
  static SupabaseClient get client => Supabase.instance.client;

  /// Shortcut al cliente de autenticación.
  static GoTrueClient get auth => client.auth;

  /// Devuelve el JWT del usuario actual, o null si no hay sesión.
  static String? get accessToken => client.auth.currentSession?.accessToken;

  /// Devuelve el ID del usuario autenticado, o null.
  static String? get currentUserId => client.auth.currentUser?.id;

  /// Indica si hay una sesión activa.
  static bool get isAuthenticated => client.auth.currentUser != null;
}

// ── Providers ────────────────────────────────────────────────────────────────

/// Provider del cliente Supabase. Disponible globalmente en el árbol de Riverpod.
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});
