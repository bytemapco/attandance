import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';

import '../helpers/fixtures.dart';

void main() {
  group('AttendanceOutcome', () {
    test('parses every server status', () {
      for (final outcome in AttendanceOutcome.values) {
        expect(AttendanceOutcome.parse(outcome.wire), outcome);
      }
    });

    test('late, approved and excused count as attended; flagged and absent do not', () {
      expect(AttendanceOutcome.late.countsAsAttended, isTrue);
      expect(AttendanceOutcome.approved.countsAsAttended, isTrue);
      expect(AttendanceOutcome.excused.countsAsAttended, isTrue);
      expect(AttendanceOutcome.flagged.countsAsAttended, isFalse);
      expect(AttendanceOutcome.absent.countsAsAttended, isFalse);
    });

    test('an unknown status is an error, not a guess', () {
      expect(() => AttendanceOutcome.parse('TELEPORTED'), throwsFormatException);
      expect(AttendanceOutcome.tryParse(null), isNull);
    });
  });

  group('History', () {
    test('a page reads entries and paging', () {
      final page = HistoryPage.fromJson(
        historyPageJson(
          [historyEntryJson(status: 'LATE'), historyEntryJson(occurrenceId: 'occ-2', status: 'ABSENT')],
          total: 40,
          hasMore: true,
        ),
      );
      expect(page.items.map((e) => e.outcome), [AttendanceOutcome.late, AttendanceOutcome.absent]);
      expect((page.total, page.hasMore), (40, true));
      expect(page.items.last.attendanceId, isNull);
      expect(page.items.first.markedAt, isNotNull);
    });

    test('scores stay null when the check did not run', () {
      final entry = HistoryEntry.fromJson(historyEntryJson());
      expect(entry.faceScore, isNull);
      expect(entry.livenessScore, isNull);
    });

    test('an empty filter sends only the paging', () {
      const filter = HistoryFilter();
      expect(filter.isEmpty, isTrue);
      expect(filter.toQuery(limit: 30, offset: 0), {'limit': 30, 'offset': 0});
    });

    test('a filter sends dates, subject and status as the server expects', () {
      final filter = HistoryFilter(
        from: DateTime.utc(2026, 11, 1),
        to: DateTime.utc(2026, 11, 30),
        courseSectionId: 'sec-1',
        outcome: AttendanceOutcome.flagged,
      );
      expect(filter.toQuery(limit: 30, offset: 60), {
        'from': '2026-11-01',
        'to': '2026-11-30',
        'course_section_id': 'sec-1',
        'status': 'FLAGGED',
        'limit': 30,
        'offset': 60,
      });
    });

    test('copyWith can clear one part of the filter', () {
      final filter = HistoryFilter(
        from: DateTime.utc(2026, 11, 1),
        courseSectionId: 'sec-1',
        outcome: AttendanceOutcome.late,
      );
      expect(filter.copyWith(clearSubject: true).courseSectionId, isNull);
      expect(filter.copyWith(clearDates: true).from, isNull);
      expect(filter.copyWith(clearOutcome: true).outcome, isNull);
      expect(filter.copyWith(clearOutcome: true).courseSectionId, 'sec-1');
    });
  });

  group('Analytics', () {
    test('reads figures, subjects, trend and streaks', () {
      final a = StudentAnalytics.fromJson(analyticsJson());
      expect(a.threshold, 75.0);
      expect(a.overall.percentage, 90.0);
      expect(a.overall.canMiss, 4);
      expect(a.overall.standing, Standing.ok);
      expect(a.subjects.single.figures.attended, 18);
      expect(a.subjects.single.subjectCode, 'MA101');
      expect(a.thisWeek!.weekStart, DateTime.utc(2026, 11, 2));
      expect((a.currentStreak, a.bestStreak), (3, 7));
    });

    test('no percentage before any class is held', () {
      final a = StudentAnalytics.fromJson(
        analyticsJson(
          overall: figuresJson(conducted: 0, attended: 0, percentage: null, canMiss: 0, standing: 'NO_DATA'),
        ),
      );
      expect(a.overall.percentage, isNull);
      expect(a.overall.standing, Standing.noData);
    });

    test('shortages are the subjects below the minimum, worst first', () {
      Map<String, dynamic> subject(String id, double pct, String standing) => {
        ...figuresJson(percentage: pct, standing: standing),
        'course_section_id': id,
        'subject_name': id,
        'subject_code': id,
        'class_code': 'CE-A',
        'teacher_name': null,
      };
      final a = StudentAnalytics.fromJson(
        analyticsJson(
          subjects: [subject('a', 70, 'SHORTAGE'), subject('b', 90, 'OK'), subject('c', 50, 'SHORTAGE')],
        ),
      );
      expect(a.shortages.map((s) => s.courseSectionId), ['c', 'a']);
    });

    test('an unknown standing is an error', () {
      expect(() => Standing.parse('GREAT'), throwsFormatException);
    });
  });

  group('IST clock', () {
    test('converts a phone clock in any zone to IST wall time', () {
      final ist = istNow(DateTime.utc(2026, 11, 2, 3, 30));
      expect((ist.hour, ist.minute), (9, 0));
    });

    test('turns a date and HH:MM into one wall-clock moment', () {
      expect(istWallTime(DateTime.utc(2026, 11, 2), '14:05'), DateTime.utc(2026, 11, 2, 14, 5));
    });

    test('formats and parses server days', () {
      expect(formatServerDay(DateTime.utc(2026, 3, 9)), '2026-03-09');
      expect(parseServerDay('2026-03-09'), DateTime.utc(2026, 3, 9));
    });

    test('the Monday of a week', () {
      expect(mondayOf(DateTime.utc(2026, 11, 5)), DateTime.utc(2026, 11, 2));
      expect(mondayOf(DateTime.utc(2026, 11, 2)), DateTime.utc(2026, 11, 2));
      expect(mondayOf(DateTime.utc(2026, 11, 8)), DateTime.utc(2026, 11, 2));
    });
  });
}
