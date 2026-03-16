import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../core/models/app_role.dart';
import '../core/services/auth_service.dart';
import '../features/auth/screens/blocked_screen.dart';
import '../features/auth/screens/campaign_selector_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/coordinator/screens/coordinator_shell_screen.dart';
import '../features/volunteer/screens/my_houses_screen.dart';
import '../features/volunteer/screens/notifications_screen.dart';
import '../features/volunteer/screens/volunteer_settings_screen.dart';
import '../features/volunteer/screens/visit_form_screen.dart';
import '../features/volunteer/screens/volunteer_home_screen.dart';

part 'router.g.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

@riverpod
GoRouter router(Ref ref) {
  final authState = ref.watch(currentUserProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    debugLogDiagnostics: false,
    initialLocation: '/login',
    redirect: (context, state) {
      final user = authState.valueOrNull;
      final isLoading = authState.isLoading;
      final loc = state.matchedLocation;

      if (isLoading) return null;

      final isLoginRoute = loc == '/login' || loc == '/';

      if (user == null) {
        return isLoginRoute ? null : '/login';
      }

      final role = user.appRole;

      // super_admin → pantalla de bloqueo
      if (role == AppRole.superAdmin) {
        return loc == '/blocked' ? null : '/blocked';
      }

      // Usuarios con múltiples campañas → selector
      if (user.campaignId.isEmpty) {
        return loc == '/select-campaign' ? null : '/select-campaign';
      }

      // Redirigir login → destino según rol
      if (isLoginRoute) {
        return switch (role) {
          AppRole.volunteer => '/volunteer/home',
          AppRole.fieldCoordinator => '/coordinator',
          _ => '/volunteer/home', // fase 2+
        };
      }

      return null;
    },
    routes: [
      // ── Auth ────────────────────────────────────────────────────────────────
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/select-campaign',
        builder: (_, __) => const CampaignSelectorScreen(),
      ),
      GoRoute(
        path: '/blocked',
        builder: (_, __) => const BlockedScreen(),
      ),

      // ── Voluntario ──────────────────────────────────────────────────────────
      GoRoute(
        path: '/volunteer/home',
        builder: (_, __) => const VolunteerHomeScreen(),
      ),
      GoRoute(
        path: '/volunteer/houses',
        builder: (_, __) => const MyHousesScreen(),
      ),
      GoRoute(
        path: '/volunteer/visit/:contactId',
        builder: (_, state) => VisitFormScreen(
          contactId: state.pathParameters['contactId']!,
        ),
      ),
      GoRoute(
        path: '/volunteer/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/volunteer/settings',
        builder: (_, __) => const VolunteerSettingsScreen(),
      ),

      // ── Field Coordinator ───────────────────────────────────────────────────
      GoRoute(
        path: '/coordinator',
        builder: (_, __) => const CoordinatorShellScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Ruta no encontrada: ${state.matchedLocation}'),
      ),
    ),
  );
}
