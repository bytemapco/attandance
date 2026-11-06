import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';

TimetableEntry entry({
  String start = '09:00',
  String end = '10:00',
  String status = 'SCHEDULED',
  AttendanceOutcome? outcome,
  bool windowOpen = false,
  DateTime? windowClosesAt,
  String? occurrenceId = 'occ-1',
}) => TimetableEntry(
  occurrenceId: occurrenceId,
  courseSectionId: 'sec-1',
  subjectName: 'Maths',
  subjectCode: 'MA101',
  classCode: 'CE-A-1',
  date: DateTime.utc(2026, 11, 2),
  startTime: start,
  endTime: end,
  classroomName: null,
  teacherName: null,
  status: status,
  cancellationReason: null,
  isSubstitute: false,
  isExtra: false,
  outcome: outcome,
  windowOpen: windowOpen,
  windowClosesAt: windowClosesAt,
);

// 09:00 IST on 2 Nov 2026 is 03:30 UTC.
DateTime istClock(int hour, int minute) =>
    DateTime.utc(2026, 11, 2, hour, minute).subtract(const Duration(hours: 5, minutes: 30));

void main() {
  group('AttendanceOutcome', () {
    test('parses every status the server sends, ignoring case and spaces', () {
      for (final outcome in AttendanceOutcome.values) {
        expect(AttendanceOutcome.parse(' ${outcome.wire.toLowerCase()} '), outcome);
      }
    });

    test('refuses a status it does not know instead of guessing', () {
      expect(() => AttendanceOutcome.parse('MAYBE'), throwsFormatException);
    });

    test('tryParse passes null through', () {
      expect(AttendanceOutcome.tryParse(null), isNull);
      expect(AttendanceOutcome.tryParse('LATE'), AttendanceOutcome.late);
    });

    test('a flagged mark does not count until a teacher approves it', () {
      expect(AttendanceOutcome.flagged.countsAsAttended, isFalse);
      expect(AttendanceOutcome.absent.countsAsAttended, isFalse);
      expect(AttendanceOutcome.approved.countsAsAttended, isTrue);
      expect(AttendanceOutcome.late.countsAsAttended, isTrue);
    });

    test('isPresentOrApproved matches only those two', () {
      expect(isPresentOrApproved(' present '), isTrue);
      expect(isPresentOrApproved('APPROVED'), isTrue);
      expect(isPresentOrApproved('LATE'), isFalse);
      expect(isPresentOrApproved('FLAGGED'), isFalse);
    });
  });

  group('class phase', () {
    test('is upcoming before the start', () {
      expect(entry().phaseAt(istClock(8, 59)), ClassPhase.upcoming);
    });

    test('is in progress from the start until the end', () {
      expect(entry().phaseAt(istClock(9, 0)), ClassPhase.inProgress);
      expect(entry().phaseAt(istClock(9, 59)), ClassPhase.inProgress);
    });

    test('has ended at the end time', () {
      expect(entry().phaseAt(istClock(10, 0)), ClassPhase.ended);
    });

    test('a cancelled class stays cancelled whatever the time', () {
      expect(entry(status: 'CANCELLED').phaseAt(istClock(9, 30)), ClassPhase.cancelled);
    });

    test('is open for attendance while the teacher window is open and the student has no mark', () {
      final open = entry(windowOpen: true, windowClosesAt: istClock(9, 45));
      expect(open.phaseAt(istClock(9, 30)), ClassPhase.openForAttendance);
      expect(open.canMarkAt(istClock(9, 30)), isTrue);
    });

    test('saved data that says open is not trusted once the close time has passed', () {
      final stale = entry(windowOpen: true, windowClosesAt: istClock(9, 45));
      expect(stale.canMarkAt(istClock(9, 46)), isFalse);
      expect(stale.phaseAt(istClock(9, 46)), ClassPhase.inProgress);
    });

    test('a window with no close time cannot be marked', () {
      expect(entry(windowOpen: true).canMarkAt(istClock(9, 30)), isFalse);
    });

    test('a class with no occurrence yet cannot be marked', () {
      final extra = entry(windowOpen: true, windowClosesAt: istClock(9, 45), occurrenceId: null);
      expect(extra.canMarkAt(istClock(9, 30)), isFalse);
    });

    test('a marked class is marked, and an absent placeholder still allows marking', () {
      final marked = entry(outcome: AttendanceOutcome.present, windowOpen: true, windowClosesAt: istClock(9, 45));
      expect(marked.phaseAt(istClock(9, 30)), ClassPhase.marked);

      final placeholder = entry(outcome: AttendanceOutcome.absent, windowOpen: true, windowClosesAt: istClock(9, 45));
      expect(placeholder.phaseAt(istClock(9, 30)), ClassPhase.openForAttendance);
    });
  });

  group('timetable JSON', () {
    test('sorts a day by start time', () {
      Map<String, dynamic> row(String start) => {
        'course_section_id': 's', 'subject_name': 'n', 'subject_code': 'c', 'class_code': 'k',
        'date': '2026-11-02', 'start_time': start, 'end_time': '23:00', 'status': 'SCHEDULED',
      };
      final day = TimetableDay.fromJson({
        'date': '2026-11-02',
        'entries': [row('11:00'), row('09:00'), row('10:00')],
      });
      expect(day.entries.map((e) => e.startTime), ['09:00', '10:00', '11:00']);
    });
  });

}
