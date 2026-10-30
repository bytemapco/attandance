import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

void main() {
  group('Attendance Status Evaluators', () {
    test('isPresentOrApproved accurately recognizes statuses', () {
      expect(isPresentOrApproved('Present'), isTrue);
      expect(isPresentOrApproved('APPROVED'), isTrue);
      expect(isPresentOrApproved('present '), isTrue);
      expect(isPresentOrApproved('Absent'), isFalse);
      expect(isPresentOrApproved('Flagged'), isFalse);
    });

    test('isAbsent and isFlagged evaluate correctly', () {
      expect(isAbsent('absent'), isTrue);
      expect(isAbsent('present'), isFalse);
      expect(isFlagged('flagged'), isTrue);
      expect(isFlagged('approved'), isFalse);
    });
  });

  group('Attendance Streak Calculations', () {
    test('calculateStreak returns 0 on empty history', () {
      expect(calculateStreak([]), 0);
    });

    test('calculateStreak calculates continuous recent presence', () {
      final now = DateTime.now();
      final history = <AttendanceHistoryItem>[
        AttendanceHistoryItem(
          attendanceId: '1',
          classId: 'c1',
          className: 'Class A',
          subject: 'Math',
          sessionId: 's1',
          status: 'Present',
          markedAt: now.subtract(const Duration(days: 1)),
        ),
        AttendanceHistoryItem(
          attendanceId: '2',
          classId: 'c2',
          className: 'Class B',
          subject: 'Science',
          sessionId: 's2',
          status: 'Approved',
          markedAt: now.subtract(const Duration(days: 2)),
        ),
        AttendanceHistoryItem(
          attendanceId: '3',
          classId: 'c3',
          className: 'Class C',
          subject: 'English',
          sessionId: 's3',
          status: 'Absent',
          markedAt: now.subtract(const Duration(days: 3)),
        ),
      ];

      expect(calculateStreak(history), 2);
    });

    test('calculateHighestStreak finds the longest streak block', () {
      final now = DateTime.now();
      final history = <AttendanceHistoryItem>[
        AttendanceHistoryItem(
          attendanceId: '1',
          classId: 'c1',
          className: 'S1',
          subject: 'Sub1',
          sessionId: 's1',
          status: 'Present',
          markedAt: now.subtract(const Duration(days: 5)),
        ),
        AttendanceHistoryItem(
          attendanceId: '2',
          classId: 'c2',
          className: 'S2',
          subject: 'Sub2',
          sessionId: 's2',
          status: 'Present',
          markedAt: now.subtract(const Duration(days: 4)),
        ),
        AttendanceHistoryItem(
          attendanceId: '3',
          classId: 'c3',
          className: 'S3',
          subject: 'Sub3',
          sessionId: 's3',
          status: 'Present',
          markedAt: now.subtract(const Duration(days: 3)),
        ),
        AttendanceHistoryItem(
          attendanceId: '4',
          classId: 'c4',
          className: 'S4',
          subject: 'Sub4',
          sessionId: 's4',
          status: 'Absent',
          markedAt: now.subtract(const Duration(days: 2)),
        ),
        AttendanceHistoryItem(
          attendanceId: '5',
          classId: 'c5',
          className: 'S5',
          subject: 'Sub5',
          sessionId: 's5',
          status: 'Present',
          markedAt: now.subtract(const Duration(days: 1)),
        ),
      ];

      expect(calculateHighestStreak(history), 3);
    });
  });
}
