import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/data/local/offline_sync_service.dart';
import 'package:smart_attendance_app/data/repositories/config_repository.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/utils/logger.dart';

String inferNotificationSeverity(Map<String, dynamic> data) {
  final type = data['type'] as String?;
  if (type == 'low_attendance' || type == 'anomaly') return kSeverityDanger;
  if (type == 'warning') return kSeverityWarning;
  return kSeverityInfo;
}

class SmartAttendanceApp extends ConsumerStatefulWidget {
  const SmartAttendanceApp({super.key});

  @override
  ConsumerState<SmartAttendanceApp> createState() => _SmartAttendanceAppState();
}

class _SmartAttendanceAppState extends ConsumerState<SmartAttendanceApp> {
  String? _pendingRoute;

  @override
  void initState() {
    super.initState();
    ref.read(offlineSyncServiceProvider).startListening();
    Future.microtask(() => ref.read(configRepositoryProvider).fetchAndCacheConfig());
    _initializeFcm();
  }

  Future<void> _handleNotificationClick(RemoteMessage message) async {
    final data = message.data;
    final route = data['route'] as String?;
    final attendanceId = data['attendance_id'] as String?;
    if (route != null) {
      String targetRoute = route;
      if (route == '/flagged_detail' || route.startsWith('/flagged')) {
        if (attendanceId != null) {
          targetRoute = '/flagged/$attendanceId';
        }
      }
      final authStatus = ref.read(authProvider).status;
      if (authStatus == AuthStatus.authenticated) {
        ref.read(routerProvider).push(targetRoute);
      } else {
        _pendingRoute = targetRoute;
      }
    }
  }

  Future<void> _syncFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await ref.read(studentApiProvider).registerFcmToken(token);
      }
    } catch (e) {
      AppLogger.error('FCM token sync on auth failed: $e');
    }
  }

  Future<void> _initializeFcm() async {
    try {
      final authStatus = ref.read(authProvider).status;
      if (authStatus == AuthStatus.authenticated) {
        final token = await FirebaseMessaging.instance.getToken();
        if (token != null) {
          try {
            await ref.read(studentApiProvider).registerFcmToken(token);
          } catch (e) {
            AppLogger.error('FCM token registration failed: $e');
          }
        }
      }

      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
        try {
          final currentAuthStatus = ref.read(authProvider).status;
          if (currentAuthStatus == AuthStatus.authenticated) {
            await ref.read(studentApiProvider).registerFcmToken(newToken);
          }
        } catch (e) {
          AppLogger.error('FCM token refresh registration failed: $e');
        }
      });

      FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
        final notifService = ref.read(notificationServiceProvider);
        await notifService.addNotification(
          title: message.notification?.title ?? 'Notification',
          body: message.notification?.body ?? '',
          severity: inferNotificationSeverity(message.data),
          source: 'push',
        );
        await ref.read(notificationsProvider.notifier).load();
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleNotificationClick(message);
      });

      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationClick(initialMessage);
      }
    } catch (e) {
      AppLogger.error('FCM listener setup failed: $e');
    }
  }

  @override
  void dispose() {
    ref.read(offlineSyncServiceProvider).dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthStateData>(authProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) {
        if (previous?.status != AuthStatus.authenticated) {
          _syncFcmToken();
        }
        if (_pendingRoute != null) {
          final route = _pendingRoute!;
          _pendingRoute = null;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref.read(routerProvider).push(route);
          });
        }
      }
    });

    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Smart Attendance',
      debugShowCheckedModeBanner: false,
      theme: buildSasTheme(),
      routerConfig: router,
    );
  }
}
