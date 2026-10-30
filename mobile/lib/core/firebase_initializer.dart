import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/services.dart';
import 'package:smart_attendance_app/app/app.dart';
import 'package:smart_attendance_app/core/firebase_options.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/utils/logger.dart';


@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    if (Firebase.apps.isEmpty) {
      final options = DefaultFirebaseOptions.currentPlatform;
      if (options != null) {
        await Firebase.initializeApp(options: options);
      } else {
        await Firebase.initializeApp();
      }
    }
  } catch (_) {
    return;
  }

  final notificationService = NotificationService();
  await notificationService.initialize();
  await notificationService.addNotification(
    title: message.notification?.title ?? 'Notification',
    body: message.notification?.body ?? '',
    severity: inferNotificationSeverity(message.data),
    source: 'push',
  );
}

class FirebaseInitializer {
  static bool _isInitialized = false;
  static bool get isInitialized => _isInitialized;

  static Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final options = DefaultFirebaseOptions.currentPlatform;
      if (options != null) {
        await Firebase.initializeApp(options: options);
        _isInitialized = true;
      } else {
        // Try native resource configuration if bundled
        await Firebase.initializeApp();
        _isInitialized = true;
      }

      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await FirebaseMessaging.instance.requestPermission();
      AppLogger.info('Firebase & push notifications initialized successfully.');
    } on PlatformException catch (e) {
      AppLogger.info(
        'Push notifications (FCM) inactive: No Firebase configuration found ($e). '
        'Add google-services.json or FIREBASE_* in .env to activate.',
      );
    } catch (e) {
      AppLogger.info(
        'Push notifications (FCM) skipped: $e',
      );
    }
  }
}
