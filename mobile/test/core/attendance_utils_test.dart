import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

void main() {
  group('Attendance Status Utilities', () {
    test('isPresentOrApproved accurately identifies present and approved', () {
      expect(isPresentOrApproved(kStatusPresent), isTrue);
      expect(isPresentOrApproved(kStatusApproved), isTrue);
      expect(isPresentOrApproved(kStatusAbsent), isFalse);
      expect(isPresentOrApproved(kStatusFlagged), isFalse);
      expect(isPresentOrApproved('Unknown'), isFalse);
    });

    test('isAbsent and isFlagged evaluate statuses correctly', () {
      expect(isAbsent(kStatusAbsent), isTrue);
      expect(isAbsent(kStatusPresent), isFalse);

      expect(isFlagged(kStatusFlagged), isTrue);
      expect(isFlagged(kStatusApproved), isFalse);
    });

    test('computeSubjectPct computes accurate percentage', () {
      expect(computeSubjectPct(8, 10), 80.0);
      expect(computeSubjectPct(0, 10), 0.0);
      expect(computeSubjectPct(5, 0), 0.0);
    });

    test('computeAttendanceNeeds calculates canMiss and needToAttend', () {
      final aboveTarget = computeAttendanceNeeds(
        present: 90,
        total: 100,
        target: 75.0,
      );
      expect(aboveTarget.canMiss, greaterThan(0));
      expect(aboveTarget.needToAttend, 0);

      final belowTarget = computeAttendanceNeeds(
        present: 50,
        total: 100,
        target: 75.0,
      );
      expect(belowTarget.canMiss, 0);
      expect(belowTarget.needToAttend, greaterThan(0));
    });
  });

  group('Streak Calculations', () {
    final now = DateTime.now();

    AttendanceHistoryItem makeItem(String status, int daysAgo) {
      return AttendanceHistoryItem(
        attendanceId: 'att-$daysAgo',
        classId: 'c-1',
        className: 'Math',
        subject: 'Calculus',
        sessionId: 'sess-$daysAgo',
        status: status,
        markedAt: now.subtract(Duration(days: daysAgo)),
      );
    }

    test('calculateStreak returns continuous present count from latest', () {
      final history = [
        makeItem(kStatusPresent, 0),
        makeItem(kStatusPresent, 1),
        makeItem(kStatusAbsent, 2),
        makeItem(kStatusPresent, 3),
      ];

      expect(calculateStreak(history), 2);
    });

    test('calculateHighestStreak computes maximum historical run', () {
      final history = [
        makeItem(kStatusPresent, 0),
        makeItem(kStatusPresent, 1),
        makeItem(kStatusAbsent, 2),
        makeItem(kStatusPresent, 3),
        makeItem(kStatusPresent, 4),
        makeItem(kStatusPresent, 5),
        makeItem(kStatusAbsent, 6),
      ];

      expect(calculateHighestStreak(history), 3);
    });

    test('empty history returns 0 streak', () {
      expect(calculateStreak([]), 0);
      expect(calculateHighestStreak([]), 0);
    });
  });
}
