import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Maneja push notifications via Firebase Cloud Messaging (FCM)
/// y notificaciones locales con [flutter_local_notifications].
class NotificationService {
  NotificationService(this._messaging, this._localNotifications);

  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications;

  final StreamController<RemoteMessage> _messageController =
      StreamController<RemoteMessage>.broadcast();

  /// Stream de mensajes recibidos mientras la app está en primer plano.
  Stream<RemoteMessage> get onMessage => _messageController.stream;

  /// Inicializa FCM y notificaciones locales.
  /// Debe llamarse en [main()] tras [Firebase.initializeApp].
  Future<void> initialize() async {
    // Configurar canal de notificaciones locales para Android.
    const androidChannel = AndroidNotificationChannel(
      'civicos_high_importance',
      'Scrutix Notificaciones',
      description: 'Notificaciones importantes de Scrutix',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Inicializar plugin de notificaciones locales.
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );
    await _localNotifications.initialize(initSettings);

    // Escuchar mensajes en primer plano.
    FirebaseMessaging.onMessage.listen((message) {
      _messageController.add(message);
      _showLocalNotification(message);
    });

    // Escuchar apertura de la app desde una notificación (background).
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _messageController.add(message);
    });
  }

  /// Solicita permiso de notificaciones al usuario (iOS / Android 13+).
  Future<NotificationSettings> requestPermission() async {
    return _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
  }

  /// Obtiene el token FCM del dispositivo para registrarlo en el backend.
  /// Devuelve null si no hay permisos o no hay conexión.
  Future<String?> getFCMToken() async {
    try {
      return await _messaging.getToken();
    } catch (_) {
      return null;
    }
  }

  /// Suscribe al usuario a un topic de Supabase/FCM (ej: ID de campaña).
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
  }

  /// Des-suscribe de un topic.
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
  }

  void dispose() {
    _messageController.close();
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    const androidDetails = AndroidNotificationDetails(
      'civicos_high_importance',
      'Scrutix Notificaciones',
      importance: Importance.high,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      details,
    );
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final service = NotificationService(
    FirebaseMessaging.instance,
    FlutterLocalNotificationsPlugin(),
  );
  ref.onDispose(service.dispose);
  return service;
});
