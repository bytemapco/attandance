import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/history_grouping.dart';
import 'package:smart_attendance_app/core/performance_summary.dart';
import 'package:smart_attendance_app/core/timetable_focus.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';

HistoryEntry historyEntry(DateTime date, AttendanceOutcome outcome) => HistoryEntry(
  occurrenceId: 'o', attendanceId: null, courseSectionId: 's', subjectName: 'n', subjectCode: 'c',
  classCode: 'k', date: date, startTime: '09:00', endTime: '10:00', outcome: outcome, method: null,
  markedAt: null, faceScore: null, livenessScore: null, remarks: null, studentNote: null, canAddNote: false,
);

AttendanceFigures figures(Standing standing, {int canMiss = 0, int mustAttend = 0}) => AttendanceFigures(
  conducted: 10, attended: 5, percentage: 50, canMiss: canMiss, mustAttend: mustAttend, standing: standing,
);

StudentAnalytics analytics(AttendanceFigures overall, {double threshold = 75, List<SubjectFigures> subjects = const []}) =>
    StudentAnalytics(
      threshold: threshold, atRiskMargin: 5, overall: overall, subjects: subjects,
      weeklyTrend: const [], currentStreak: 0, bestStreak: 0,
    );

SubjectFigures subject(String name) => SubjectFigures(
  courseSectionId: name, subjectName: name, subjectCode: name, classCode: 'k', teacherName: null,
  figures: figures(Standing.shortage),
);

TimetableEntry classAt(String start, String end, {bool cancelled = false}) => TimetableEntry(
  occurrenceId: 'o-$start', courseSectionId: 's', subjectName: 'n', subjectCode: 'c', classCode: 'k',
  date: DateTime.utc(2026, 11, 2), startTime: start, endTime: end, classroomName: null, teacherName: null,
  status: cancelled ? 'CANCELLED' : 'SCHEDULED', cancellationReason: null, isSubstitute: false,
  isExtra: false, outcome: null, windowOpen: false, windowClosesAt: null,
);

// A UTC moment that is [hour]:[minute] on 2 Nov 2026 in IST.
DateTime atIst(int hour, int minute) =>
    DateTime.utc(2026, 11, 2, hour, minute).subtract(const Duration(hours: 5, minutes: 30));

void main() {
  group('groupByDay', () {
    final nov2 = DateTime.utc(2026, 11, 2);
    final nov1 = DateTime.utc(2026, 11, 1);

    test('groups neighbouring entries of the same date and keeps the order', () {
      final days = groupByDay([
        historyEntry(nov2, AttendanceOutcome.present),
        historyEntry(nov2, AttendanceOutcome.absent),
        historyEntry(nov1, AttendanceOutcome.present),
      ]);
      expect(days.map((d) => d.date), [nov2, nov1]);
      expect(days.first.entries, hasLength(2));
    });

    test('summarises the day, mentioning absences only when there are some', () {
      final one = groupByDay([historyEntry(nov2, AttendanceOutcome.present)]).single;
      final mixed = groupByDay([
        historyEntry(nov2, AttendanceOutcome.present),
        historyEntry(nov2, AttendanceOutcome.absent),
        historyEntry(nov2, AttendanceOutcome.late),
      ]).single;
      expect(one.summary, '1 class');
      expect(mixed.summary, '3 classes · 1 absent');
    });

    test('an empty history has no days', () {
      expect(groupByDay([]), isEmpty);
    });
  });

  group('performanceSummary', () {
    test('says nothing has been held yet', () {
      expect(performanceSummary(analytics(figures(Standing.noData))), startsWith('No classes have been held'));
    });

    test('tells a student in shortage how many classes in a row get them back', () {
      final text = performanceSummary(analytics(figures(Standing.shortage, mustAttend: 3)));
      expect(text, 'You are below the 75% minimum. Attending the next 3 classes in a row gets you back to it.');
    });

    test('uses the singular for one class', () {
      expect(performanceSummary(analytics(figures(Standing.shortage, mustAttend: 1))), contains('next 1 class in a row'));
    });

    test('warns a student at the edge that one more absence drops them below', () {
      expect(performanceSummary(analytics(figures(Standing.atRisk))), contains('One more absence'));
      expect(performanceSummary(analytics(figures(Standing.atRisk, canMiss: 2))), contains('miss 2 classes'));
    });

    test('shows a fractional minimum with one decimal', () {
      expect(performanceSummary(analytics(figures(Standing.ok, canMiss: 4), threshold: 72.5)), contains('72.5% minimum'));
    });

    test('subjectAdvice is silent without data and otherwise says what to do', () {
      expect(subjectAdvice(figures(Standing.noData)), isNull);
      expect(subjectAdvice(figures(Standing.shortage, mustAttend: 2)), 'Attend the next 2 classes to recover');
      expect(subjectAdvice(figures(Standing.ok, canMiss: 1)), 'Can miss 1 class');
      expect(subjectAdvice(figures(Standing.atRisk)), 'No classes can be missed');
    });

    test('the shortage banner names up to two subjects, then counts the rest', () {
      expect(shortageBanner(analytics(figures(Standing.ok))), isNull);
      expect(shortageBanner(analytics(figures(Standing.ok), subjects: [subject('Maths')])), 'Below the 75% minimum in Maths.');
      expect(
        shortageBanner(analytics(figures(Standing.ok), subjects: [subject('A'), subject('B')])),
        'Below the 75% minimum in A and B.',
      );
      expect(
        shortageBanner(analytics(figures(Standing.ok), subjects: [subject('A'), subject('B'), subject('C'), subject('D')])),
        'Below the 75% minimum in A, B and 2 more.',
      );
    });
  });

  group('focusedClass', () {
    final day = [classAt('09:00', '10:00'), classAt('11:00', '12:00'), classAt('14:00', '15:00')];

    test('highlights the class happening now', () {
      final focus = focusedClass(day, atIst(11, 30))!;
      expect(focus.entry.startTime, '11:00');
      expect(focus.isCurrent, isTrue);
    });

    test('between classes it highlights the next one', () {
      final focus = focusedClass(day, atIst(12, 30))!;
      expect(focus.entry.startTime, '14:00');
      expect(focus.isCurrent, isFalse);
    });

    test('is null once the day is over', () {
      expect(focusedClass(day, atIst(16, 0)), isNull);
    });

    test('skips a cancelled class', () {
      final focus = focusedClass([classAt('09:00', '10:00', cancelled: true), classAt('11:00', '12:00')], atIst(8, 0))!;
      expect(focus.entry.startTime, '11:00');
    });
  });

}
