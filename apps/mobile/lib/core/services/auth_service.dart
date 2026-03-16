import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_role.dart';
import '../models/user_profile.dart';

/// Servicio de autenticación. Encapsula toda la lógica de sesión
/// con Supabase Auth y el perfil del usuario.
class AuthService {
  AuthService(this._supabase);

  final SupabaseClient _supabase;

  /// Stream de cambios en el estado de autenticación de Supabase.
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  /// Devuelve el [User] de Supabase actualmente autenticado, o null.
  User? get currentSupabaseUser => _supabase.auth.currentUser;

  /// Inicia sesión con email y contraseña.
  /// Lanza [AuthException] si las credenciales son inválidas.
  Future<UserProfile> login(String email, String password) async {
    final response = await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );

    final user = response.user;
    if (user == null) {
      throw const AuthException('Login fallido: usuario nulo.');
    }

    return _fetchProfile(user.id);
  }

  /// Cierra la sesión actual.
  Future<void> logout() async {
    await _supabase.auth.signOut();
  }

  /// Obtiene el perfil del usuario autenticado desde la tabla `profiles`.
  /// Devuelve null si no hay sesión activa.
  Future<UserProfile?> getCurrentUser() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return null;
    try {
      return await _fetchProfile(user.id);
    } catch (_) {
      return null;
    }
  }

  /// Devuelve el rol del usuario actual, o [AppRole.unknown] si no hay sesión.
  Future<AppRole> getRole() async {
    final profile = await getCurrentUser();
    return profile?.appRole ?? AppRole.unknown;
  }

  /// Refresca el token de sesión. Útil para extender sesiones largas.
  Future<void> refreshSession() async {
    await _supabase.auth.refreshSession();
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  Future<UserProfile> _fetchProfile(String userId) async {
    final data = await _supabase
        .from('profiles')
        .select('id, tenant_id, full_name, role, campaign_ids, avatar_url')
        .eq('id', userId)
        .single();

    // campaign_ids es un array — usamos el primero como campaign activo.
    final campaignIds = (data['campaign_ids'] as List<dynamic>?) ?? [];
    final campaignId = campaignIds.isNotEmpty ? campaignIds.first as String : '';

    // Email siempre del usuario de auth (no en profiles).
    final email = _supabase.auth.currentUser?.email ?? '';

    final flat = Map<String, dynamic>.from(data)
      ..['campaign_id'] = campaignId
      ..['campaign_name'] = ''
      ..['email'] = email
      ..remove('campaign_ids');

    return UserProfile.fromJson(flat);
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(Supabase.instance.client);
});

/// Provider del perfil del usuario actual. Se invalida al cambiar la sesión.
final currentUserProvider = FutureProvider<UserProfile?>((ref) async {
  final authService = ref.watch(authServiceProvider);
  return authService.getCurrentUser();
});

/// Provider del rol actual.
final currentRoleProvider = FutureProvider<AppRole>((ref) async {
  final profile = await ref.watch(currentUserProvider.future);
  return profile?.appRole ?? AppRole.unknown;
});
