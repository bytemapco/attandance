import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/timetable_focus.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';

import '../helpers/fixtures.dart';

TimetableEntry entry({
  String start = '09:00',
  String end = '10:00',
  String status = 'SCHEDULED',
  String? attendanceStatus,
  bool windowOpen = false,
  String? windowClosesAt,
  String? occurrenceId,
}) => TimetableEntry.fromJson(
  timetableEntryJson(
    start: start,
    end: end,
    status: status,
    attendanceStatus: attendanceStatus,
    windowOpen: windowOpen,
    windowClosesAt: windowClosesAt,
    occurrenceId: occurrenceId,
  ),
);

/// 2 Nov 2026 at the given IST time, as the instant the phone's clock would show.
DateTime at(int hour, int minute) =>
    DateTime.utc(2026, 11, 2, hour, minute).subtract(const Duration(hours: 5, minutes: 30));

void main() {
  group('TimetableEntry', () {
    test('reads the server answer', () {
      final e = entry(status: 'CANCELLED');
      expect(e.subjectName, 'Maths');
      expect(e.date, DateTime.utc(2026, 11, 2));
      expect(e.startsAt, DateTime.utc(2026, 11, 2, 9));
      expect(e.isCancelled, isTrue);
    });

    test('a class before its start is upcoming, during is in progress, after is ended', () {
      final e = entry();
      expect(e.phaseAt(at(8, 59)), ClassPhase.upcoming);
      expect(e.phaseAt(at(9, 0)), ClassPhase.inProgress);
      expect(e.phaseAt(at(9, 59)), ClassPhase.inProgress);
      expect(e.phaseAt(at(10, 0)), ClassPhase.ended);
    });

    test('a cancelled class is cancelled whatever the time', () {
      expect(entry(status: 'CANCELLED').phaseAt(at(9, 30)), ClassPhase.cancelled);
    });

    test('a class with a mark is marked, even after it ends', () {
      final e = entry(attendanceStatus: 'PRESENT');
      expect(e.phaseAt(at(9, 30)), ClassPhase.marked);
      expect(e.phaseAt(at(12, 0)), ClassPhase.marked);
      expect(e.outcome, AttendanceOutcome.present);
    });

    test('an absence is not a mark', () {
      expect(entry(attendanceStatus: 'ABSENT').phaseAt(at(12, 0)), ClassPhase.ended);
    });

    test('an open window lets the student mark until it closes', () {
      final e = entry(
        occurrenceId: 'occ-1',
        windowOpen: true,
        windowClosesAt: at(10, 0).toUtc().toIso8601String(),
      );
      expect(e.canMarkAt(at(9, 30)), isTrue);
      expect(e.phaseAt(at(9, 30)), ClassPhase.openForAttendance);
      expect(e.canMarkAt(at(10, 1)), isFalse);
    });

    test('saved data cannot offer a window that has since closed', () {
      final e = entry(
        occurrenceId: 'occ-1',
        windowOpen: true,
        windowClosesAt: at(9, 30).toUtc().toIso8601String(),
      );
      expect(e.canMarkAt(at(11, 0)), isFalse);
    });

    test('a student who already marked cannot mark again', () {
      final e = entry(
        occurrenceId: 'occ-1',
        attendanceStatus: 'PRESENT',
        windowOpen: true,
        windowClosesAt: at(10, 0).toUtc().toIso8601String(),
      );
      expect(e.canMarkAt(at(9, 30)), isFalse);
    });
  });

  group('focusedClass', () {
    final entries = [
      entry(start: '09:00', end: '10:00'),
      entry(start: '11:00', end: '12:00'),
      entry(start: '14:00', end: '15:00'),
    ];

    test('before the first class, the first is next', () {
      final focus = focusedClass(entries, at(8, 0))!;
      expect((focus.entry.startTime, focus.isCurrent), ('09:00', false));
    });

    test('during a class, that class is current', () {
      final focus = focusedClass(entries, at(11, 30))!;
      expect((focus.entry.startTime, focus.isCurrent), ('11:00', true));
    });

    test('between classes, the next one is highlighted', () {
      final focus = focusedClass(entries, at(10, 30))!;
      expect((focus.entry.startTime, focus.isCurrent), ('11:00', false));
    });

    test('after the last class there is nothing to highlight', () {
      expect(focusedClass(entries, at(16, 0)), isNull);
    });

    test('a cancelled class is skipped', () {
      final list = [entry(status: 'CANCELLED'), entry(start: '11:00', end: '12:00')];
      expect(focusedClass(list, at(8, 0))!.entry.startTime, '11:00');
    });
  });

  test('StudentTimetable finds a day by date', () {
    final table = StudentTimetable.fromJson(timetableJson([timetableEntryJson()]));
    expect(table.dayFor(DateTime.utc(2026, 11, 2))!.entries, hasLength(1));
    expect(table.dayFor(DateTime.utc(2026, 11, 3)), isNull);
  });
}
