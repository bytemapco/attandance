import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/attendance_policy.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/core/offline_window.dart';
import 'package:smart_attendance_app/core/server_time.dart';

void main() {
  group('attendance mode', () {
    test('face recognition on means a biometric mark', () {
      expect(
        attendanceModeFor(faceRecognitionEnabled: true),
        AttendanceMode.biometric,
      );
    });

    test('face recognition off falls back to the teacher QR code', () {
      expect(
        attendanceModeFor(faceRecognitionEnabled: false),
        AttendanceMode.qrCode,
      );
    });
  });

  group('windowHasClosed', () {
    final now = DateTime.utc(2026, 11, 2, 4);

    test('is open before the close time', () {
      expect(windowHasClosed(now.add(const Duration(minutes: 1)), now), isFalse);
    });

    test('is closed at the close time itself and after it', () {
      expect(windowHasClosed(now, now), isTrue);
      expect(windowHasClosed(now.subtract(const Duration(seconds: 1)), now), isTrue);
    });

    test('an old queued mark with no close time is not judged', () {
      expect(windowHasClosed(null, now), isFalse);
    });
  });

  group('IST clock', () {
    test('adds five and a half hours to UTC whatever the phone time zone is', () {
      final ist = istNow(DateTime.utc(2026, 11, 2, 3, 30));
      expect(ist, DateTime.utc(2026, 11, 2, 9));
    });

    test('rolls over midnight', () {
      expect(istNow(DateTime.utc(2026, 11, 2, 20)), DateTime.utc(2026, 11, 3, 1, 30));
    });

    test('reads a server date and HH:MM as an IST wall-clock moment', () {
      expect(
        istWallTime(DateTime.utc(2026, 11, 2), '09:30'),
        DateTime.utc(2026, 11, 2, 9, 30),
      );
    });

    test('formats class times for people', () {
      expect(formatClockTime('09:00'), '9:00 AM');
      expect(formatClockTime('12:15'), '12:15 PM');
      expect(formatClockTime('00:05'), '12:05 AM');
      expect(formatClockTime('23:59'), '11:59 PM');
    });

    test('parses and formats the server day both ways', () {
      final day = parseServerDay('2026-01-05');
      expect(day, DateTime.utc(2026, 1, 5));
      expect(formatServerDay(day), '2026-01-05');
    });

    test('drops the time from a moment', () {
      expect(istDay(DateTime.utc(2026, 11, 2, 18, 45)), DateTime.utc(2026, 11, 2));
    });

    test('finds the Monday of the week for any weekday', () {
      final monday = DateTime.utc(2026, 11, 2);
      expect(mondayOf(DateTime.utc(2026, 11, 2)), monday);
      expect(mondayOf(DateTime.utc(2026, 11, 5)), monday);
      expect(mondayOf(DateTime.utc(2026, 11, 8)), monday);
    });
  });

  group('parseServerTime', () {
    test('treats a value with no offset as UTC', () {
      final parsed = parseServerTime('2026-11-01T12:03:24');
      expect(parsed!.toUtc(), DateTime.utc(2026, 11, 1, 12, 3, 24));
    });

    test('respects an explicit Z or offset', () {
      expect(parseServerTime('2026-11-01T12:00:00Z')!.toUtc(), DateTime.utc(2026, 11, 1, 12));
      expect(
        parseServerTime('2026-11-01T17:30:00+05:30')!.toUtc(),
        DateTime.utc(2026, 11, 1, 12),
      );
    });

    test('returns null for nothing and for text that is not a date', () {
      expect(parseServerTime(null), isNull);
      expect(parseServerTime(''), isNull);
      expect(parseServerTime('soon'), isNull);
    });
  });
}
