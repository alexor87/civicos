import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Monitorea el estado de la conexión a internet.
/// Usa [connectivity_plus] para detectar cambios en tiempo real.
class ConnectivityService {
  ConnectivityService(this._connectivity);

  final Connectivity _connectivity;

  final StreamController<bool> _controller =
      StreamController<bool>.broadcast();

  StreamSubscription<List<ConnectivityResult>>? _subscription;

  /// Stream de booleanos: `true` = hay conexión, `false` = sin conexión.
  Stream<bool> get isOnline => _controller.stream;

  /// Inicia la escucha de cambios de conectividad.
  void initialize() {
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      _controller.add(_hasConnectivity(results));
    });
  }

  /// Verifica la conectividad actual en el momento de la llamada.
  Future<bool> checkConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    return _hasConnectivity(results);
  }

  /// Libera los recursos del servicio.
  void dispose() {
    _subscription?.cancel();
    _controller.close();
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  bool _hasConnectivity(List<ConnectivityResult> results) {
    return results.any(
      (r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet,
    );
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService(Connectivity());
  service.initialize();
  ref.onDispose(service.dispose);
  return service;
});

/// Stream provider que emite `true` cuando hay conexión.
final isOnlineProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(connectivityServiceProvider);
  return service.isOnline;
});

/// FutureProvider con el estado actual de conectividad.
final currentConnectivityProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(connectivityServiceProvider);
  return service.checkConnectivity();
});
