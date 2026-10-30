import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/app.dart';
import 'package:smart_attendance_app/core/background_sync_service.dart';
import 'package:smart_attendance_app/core/firebase_initializer.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/utils/logger.dart';

class AppHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    if (!kReleaseMode) {
      client.badCertificateCallback =
          (X509Certificate cert, String host, int port) {
        if (host == 'localhost' || host == '10.0.2.2' || host == '127.0.0.1') {
          return true;
        }
        return false;
      };
    }
    return client;
  }
}

Future<void> main() async {
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      HttpOverrides.global = AppHttpOverrides();

      try {
        await dotenv.load(fileName: ".env");
      } catch (_) {
        AppLogger.info('No .env file found; using default system configuration.');
      }

      FlutterError.onError = (FlutterErrorDetails details) {
        FlutterError.presentError(details);
        AppLogger.error(
          'Uncaught Flutter framework error: ${details.exception}',
          context: {'stack': details.stack?.toString()},
        );
        if (kReleaseMode) {
          Zone.current.handleUncaughtError(
            details.exception,
            details.stack ?? StackTrace.current,
          );
        }
      };

      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);

      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: Colors.transparent,
        ),
      );

      final hiveService = HiveService();
      await hiveService.initialize();

      final notificationService = NotificationService();
      await notificationService.initialize();

      // Defer non-critical background services to run after initial frame render
      WidgetsBinding.instance.addPostFrameCallback((_) {
        FirebaseInitializer.initialize();
        BackgroundSyncService.register();
      });

      runApp(
        ProviderScope(
          overrides: [
            hiveServiceProvider.overrideWithValue(hiveService),
            notificationServiceProvider.overrideWithValue(notificationService),
          ],
          child: const SmartAttendanceApp(),
        ),
      );
    },
    (error, stackTrace) {
      AppLogger.error(
        'Unhandled zoned error: $error',
        context: {'stack': stackTrace.toString()},
      );
    },
  );
}
