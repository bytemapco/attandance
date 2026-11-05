library;

import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/constants.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/core/offline_window.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/domain/models/offline_payload.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/data/local/pending_count_provider.dart';
import 'package:smart_attendance_app/utils/logger.dart';

enum SyncOutcome { drop, retry }

/// What to do with a queued mark once the server has answered (or not).
/// A 4xx is the server's final decision (outside the window, not enrolled, already recorded), so
/// the mark is dropped and the student is told why. A network failure, a server error or an expired
/// login keeps the mark for the next sync.
SyncOutcome syncOutcomeForStatus(int? statusCode) {
  if (statusCode == null || statusCode == 401) return SyncOutcome.retry;
  if (statusCode >= 400 && statusCode < 500) return SyncOutcome.drop;
  return SyncOutcome.retry;
}

final offlineSyncServiceProvider = Provider<OfflineSyncService>((ref) {
  final service = OfflineSyncService(
    ref: ref,
    studentApi: ref.read(studentApiProvider),
    hive: ref.read(hiveServiceProvider),
    notificationService: ref.read(notificationServiceProvider),
    notificationsNotifier: ref.read(notificationsProvider.notifier),
    dio: ref.read(dioProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});

class OfflineSyncService {
  final Ref _ref;
  final StudentApi _studentApi;
  final HiveService _hive;
  final NotificationService _notificationService;
  final NotificationsNotifier _notificationsNotifier;
  final Dio _dio;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  bool _isSyncing = false;

  OfflineSyncService({
    required Ref ref,
    required StudentApi studentApi,
    required HiveService hive,
    required NotificationService notificationService,
    required NotificationsNotifier notificationsNotifier,
    required Dio dio,
  }) : _ref = ref,
       _studentApi = studentApi,
       _hive = hive,
       _notificationService = notificationService,
       _notificationsNotifier = notificationsNotifier,
       _dio = dio;

  void startListening() {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((
      List<ConnectivityResult> results,
    ) {
      final isOnline = results.any((r) => r != ConnectivityResult.none);
      if (isOnline) {
        syncQueue();
      }
    });
  }

  String _className(OfflineAttendancePayload p) => p.className ?? 'a class';

  Future<void> _notify(String title, String body, String severity) =>
      _notificationService.addNotification(
        title: title,
        body: body,
        severity: severity,
      );

  Future<void> _removePayload(dynamic payload) async {
    final key = payload.key;
    if (key != null && key is int) {
      await _hive.removeFromQueue(key);
      _ref.read(pendingCountProvider.notifier).refresh();
    }
  }

  Future<void> _discard(OfflineAttendancePayload payload) async {
    await _removePayload(payload);
    await _deleteImageFile(payload.imagePath);
  }

  Future<void> _deleteImageFile(String imagePath) async {
    try {
      final file = File(imagePath);
      if (await file.exists()) await file.delete();
    } catch (_) {}
  }

  Future<int> syncQueue() async {
    if (_isSyncing) return 0;

    final queue = _hive.getQueue();
    if (queue.isEmpty) return 0;

    try {
      final response = await _dio.get<Map<String, dynamic>>('/health');
      final healthStatus = response.data?['status'] as String?;
      if (response.statusCode != 200 ||
          (healthStatus != 'healthy' && healthStatus != 'degraded')) {
        return 0;
      }
    } catch (_) {
      return 0;
    }

    _isSyncing = true;
    int syncedCount = 0;

    try {
      for (final payload in queue) {
        if (await _processPayload(payload)) syncedCount++;
      }
    } finally {
      _isSyncing = false;
      if (syncedCount > 0) await _notificationsNotifier.load();
    }
    return syncedCount;
  }

  Future<bool> _processPayload(OfflineAttendancePayload payload) async {
    final age = DateTime.now().difference(payload.capturedAt);

    if (age > kOfflinePayloadMaxAge) {
      await _discard(payload);
      await _notify(
        'Submission Expired',
        'Attendance for ${_className(payload)} was captured ${age.inMinutes} minutes ago and has expired.',
        kSeverityWarning,
      );
      return false;
    }

    if (windowHasClosed(payload.windowClosesAt, DateTime.now())) {
      await _discard(payload);
      await _notify(
        'Attendance Not Recorded',
        'The attendance window for ${_className(payload)} closed before your phone reconnected, so the mark was not sent.',
        kSeverityDanger,
      );
      return false;
    }

    try {
      await _studentApi.markAttendance(
        sessionId: payload.sessionId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy ?? 0.0,
        imagePath: payload.imagePath,
      );
      await _discard(payload);
      await _notify(
        'Offline Sync Complete',
        'Successfully synced offline attendance for ${_className(payload)}.',
        kSeveritySuccess,
      );
      return true;
    } on DioException catch (e) {
      final outcome = syncOutcomeForStatus(e.response?.statusCode);
      if (outcome == SyncOutcome.retry) {
        _handleSyncError(payload);
        return false;
      }
      await _discard(payload);
      final reason = mapDioError(e).message;
      if (e.response?.statusCode == 409) {
        await _notify(
          'Already Recorded',
          'Attendance for ${_className(payload)} was already recorded.',
          kSeverityInfo,
        );
        return false;
      }
      await _notify(
        'Attendance Not Recorded',
        'Attendance for ${_className(payload)} was not recorded: $reason',
        kSeverityDanger,
      );
      return false;
    } catch (e) {
      AppLogger.error('Sync failed: $e');
      _handleSyncError(payload);
      return false;
    }
  }

  Future<void> _handleSyncError(OfflineAttendancePayload payload) async {
    AppLogger.error('Sync failed for ${_className(payload)}');
    await _notify(
      'Sync Failed',
      'Could not sync attendance for ${_className(payload)}. Will retry automatically.',
      kSeverityWarning,
    );
  }

  void dispose() {
    _connectivitySub?.cancel();
  }
}
