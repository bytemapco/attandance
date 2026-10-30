import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/data/local/offline_sync_service.dart';
import 'package:smart_attendance_app/utils/logger.dart';
import 'package:workmanager/workmanager.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      WidgetsFlutterBinding.ensureInitialized();
      try {
        await dotenv.load(fileName: ".env");
      } catch (_) {}

      final hiveService = HiveService();
      await hiveService.initialize();

      final notificationService = NotificationService();
      await notificationService.initialize();

      final container = ProviderContainer(
        overrides: [
          hiveServiceProvider.overrideWithValue(hiveService),
          notificationServiceProvider.overrideWithValue(notificationService),
        ],
      );

      final syncService = container.read(offlineSyncServiceProvider);
      await syncService.syncQueue();
      return true;
    } catch (e) {
      AppLogger.error('Workmanager sync failed: $e');
      return false;
    }
  });
}

class BackgroundSyncService {
  static void register() {
    if (kIsWeb || !Platform.isAndroid) return;

    try {
      Workmanager().initialize(callbackDispatcher);
      Workmanager().registerPeriodicTask(
        "offline-sync-task",
        "syncQueue",
        frequency: const Duration(minutes: 15),
        constraints: Constraints(networkType: NetworkType.connected),
      );
    } catch (e) {
      AppLogger.warn('Workmanager init deferred or failed: $e');
    }
  }
}
