import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/history_grouping.dart';
import 'package:smart_attendance_app/core/performance_summary.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';

import '../helpers/fixtures.dart';

StudentAnalytics analytics({
  Map<String, dynamic>? overall,
  List<Map<String, dynamic>>? subjects,
}) => StudentAnalytics.fromJson(analyticsJson(overall: overall, subjects: subjects));

Map<String, dynamic> subject(String name, double pct, String standing) => {
  ...figuresJson(percentage: pct, standing: standing),
  'course_section_id': name,
  'subject_name': name,
  'subject_code': name,
  'class_code': 'CE-A',
  'teacher_name': null,
};

void main() {
  group('performanceSummary', () {
    test('before any class', () {
      final a = analytics(
        overall: figuresJson(conducted: 0, attended: 0, percentage: null, canMiss: 0, standing: 'NO_DATA'),
      );
      expect(performanceSummary(a), contains('No classes have been held yet'));
    });

    test('above the minimum says how many can be missed', () {
      expect(
        performanceSummary(analytics()),
        'You are above the 75% minimum. You can miss 4 classes and still stay on track.',
      );
    });

    test('one class is not pluralised', () {
      final a = analytics(overall: figuresJson(canMiss: 1));
      expect(performanceSummary(a), contains('miss 1 class and'));
    });

    test('at risk with nothing to spare', () {
      final a = analytics(overall: figuresJson(percentage: 75, canMiss: 0, standing: 'AT_RISK'));
      expect(performanceSummary(a), contains('One more absence would take you below it.'));
    });

    test('at risk with a little to spare', () {
      final a = analytics(overall: figuresJson(percentage: 78, canMiss: 2, standing: 'AT_RISK'));
      expect(performanceSummary(a), contains('miss 2 classes before you fall below it'));
    });

    test('in shortage says how many to attend in a row', () {
      final a = analytics(
        overall: figuresJson(percentage: 60, canMiss: 0, mustAttend: 12, standing: 'SHORTAGE'),
      );
      expect(performanceSummary(a), contains('Attending the next 12 classes in a row'));
    });
  });

  group('subjectAdvice', () {
    AttendanceFigures figures(Map<String, dynamic> json) => AttendanceFigures.fromJson(json);

    test('shortage advises how many to attend', () {
      expect(
        subjectAdvice(figures(figuresJson(canMiss: 0, mustAttend: 3, standing: 'SHORTAGE'))),
        'Attend the next 3 classes to recover',
      );
    });

    test('on track advises how many can be missed', () {
      expect(subjectAdvice(figures(figuresJson(canMiss: 2))), 'Can miss 2 classes');
      expect(subjectAdvice(figures(figuresJson(canMiss: 0, standing: 'AT_RISK'))), 'No classes can be missed');
    });

    test('no data has no advice', () {
      expect(subjectAdvice(figures(figuresJson(conducted: 0, percentage: null, standing: 'NO_DATA'))), isNull);
    });
  });

  group('shortageBanner', () {
    test('none when every subject is fine', () {
      expect(shortageBanner(analytics()), isNull);
    });

    test('names the subjects below the minimum, worst first', () {
      final a = analytics(
        subjects: [subject('Maths', 70, 'SHORTAGE'), subject('Physics', 50, 'SHORTAGE'), subject('Art', 90, 'OK')],
      );
      expect(shortageBanner(a), 'Below the 75% minimum in Physics and Maths.');
    });

    test('three or more are shortened', () {
      final a = analytics(
        subjects: [
          subject('A', 10, 'SHORTAGE'),
          subject('B', 20, 'SHORTAGE'),
          subject('C', 30, 'SHORTAGE'),
          subject('D', 40, 'SHORTAGE'),
        ],
      );
      expect(shortageBanner(a), 'Below the 75% minimum in A, B and 2 more.');
    });
  });

  test('percentLabel shows a dash before any class and trims whole numbers', () {
    expect(percentLabel(null), '–');
    expect(percentLabel(90), '90%');
    expect(percentLabel(77.78), '77.8%');
  });

  group('groupByDay', () {
    HistoryEntry entry(String id, String date, String status) => HistoryEntry.fromJson(
      historyEntryJson(occurrenceId: id, date: date, status: status),
    );

    test('groups neighbouring classes of the same date and keeps the order', () {
      final days = groupByDay([
        entry('a', '2026-11-03', 'PRESENT'),
        entry('b', '2026-11-03', 'ABSENT'),
        entry('c', '2026-11-02', 'PRESENT'),
      ]);
      expect(days.map((d) => d.date), [DateTime.utc(2026, 11, 3), DateTime.utc(2026, 11, 2)]);
      expect(days.first.entries.map((e) => e.occurrenceId), ['a', 'b']);
    });

    test('summarises the day', () {
      final days = groupByDay([
        entry('a', '2026-11-03', 'PRESENT'),
        entry('b', '2026-11-03', 'ABSENT'),
        entry('c', '2026-11-02', 'PRESENT'),
      ]);
      expect(days[0].summary, '2 classes · 1 absent');
      expect(days[1].summary, '1 class');
    });

    test('nothing gives no days', () {
      expect(groupByDay(const []), isEmpty);
    });
  });
}
