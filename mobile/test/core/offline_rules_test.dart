import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:smart_attendance_app/core/offline_window.dart';
import 'package:smart_attendance_app/data/api/network_errors.dart';
import 'package:smart_attendance_app/data/local/offline_sync_service.dart';
import 'package:smart_attendance_app/domain/models/offline_payload.dart';

DioException dioError(DioExceptionType type, {int? status}) => DioException(
  requestOptions: RequestOptions(path: '/x'),
  type: type,
  response: status == null
      ? null
      : Response(requestOptions: RequestOptions(path: '/x'), statusCode: status),
);

void main() {
  final now = DateTime.utc(2026, 11, 2, 4, 0);

  group('window rule for queued marks', () {
    test('a window that closes later is still open', () {
      expect(windowHasClosed(now.add(const Duration(minutes: 1)), now), isFalse);
    });

    test('a window that closed at or before now has closed', () {
      expect(windowHasClosed(now, now), isTrue);
      expect(windowHasClosed(now.subtract(const Duration(minutes: 1)), now), isTrue);
    });

    test('an unknown close time is not judged', () {
      expect(windowHasClosed(null, now), isFalse);
    });
  });

  group('what to do with a queued mark after the server answers', () {
    test('no answer, a server fault or an expired login keeps the mark', () {
      expect(syncOutcomeForStatus(null), SyncOutcome.retry);
      expect(syncOutcomeForStatus(401), SyncOutcome.retry);
      expect(syncOutcomeForStatus(500), SyncOutcome.retry);
      expect(syncOutcomeForStatus(503), SyncOutcome.retry);
    });

    test('a refusal is final: the mark is dropped', () {
      for (final code in [400, 403, 404, 409, 422]) {
        expect(syncOutcomeForStatus(code), SyncOutcome.drop, reason: '$code');
      }
    });
  });

  group('transient network errors', () {
    test('no connection and timeouts are transient', () {
      for (final type in [
        DioExceptionType.connectionError,
        DioExceptionType.connectionTimeout,
        DioExceptionType.sendTimeout,
        DioExceptionType.receiveTimeout,
      ]) {
        expect(isTransientNetworkError(dioError(type)), isTrue, reason: '$type');
      }
    });

    test('a server fault is transient; a refusal is not', () {
      expect(isTransientNetworkError(dioError(DioExceptionType.badResponse, status: 502)), isTrue);
      expect(isTransientNetworkError(dioError(DioExceptionType.badResponse, status: 409)), isFalse);
      expect(isTransientNetworkError(dioError(DioExceptionType.cancel)), isFalse);
    });
  });

  group('queued payload storage', () {
    late Directory dir;

    setUp(() async {
      dir = await Directory.systemTemp.createTemp('payload_box');
      Hive.init(dir.path);
      if (!Hive.isAdapterRegistered(0)) {
        Hive.registerAdapter(OfflineAttendancePayloadAdapter());
      }
    });

    tearDown(() async {
      await Hive.close();
      await dir.delete(recursive: true);
    });

    test('keeps the window close time', () async {
      final box = await Hive.openBox<OfflineAttendancePayload>('queue');
      await box.add(
        OfflineAttendancePayload(
          sessionId: 's1',
          latitude: 1,
          longitude: 2,
          imagePath: '/x.jpg',
          capturedAt: now,
          className: 'Maths',
          accuracy: 5,
          windowClosesAt: now.add(const Duration(minutes: 30)),
        ),
      );
      final saved = box.values.single;
      expect(saved.windowClosesAt, now.add(const Duration(minutes: 30)));
      expect(saved.className, 'Maths');
    });

    test('a mark queued without a close time still reads back', () async {
      final box = await Hive.openBox<OfflineAttendancePayload>('queue');
      await box.add(
        OfflineAttendancePayload(
          sessionId: 's1',
          latitude: 1,
          longitude: 2,
          imagePath: '/x.jpg',
          capturedAt: now,
        ),
      );
      expect(box.values.single.windowClosesAt, isNull);
    });
  });
}
