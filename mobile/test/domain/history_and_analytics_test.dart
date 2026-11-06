import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';

void main() {
  group('history', () {
    final json = {
      'occurrence_id': 'occ-1', 'attendance_id': null, 'course_section_id': 'sec-1',
      'subject_name': 'Maths', 'subject_code': 'MA101', 'class_code': 'CE-A-1', 'date': '2026-11-02',
      'start_time': '09:00', 'end_time': '10:00', 'status': 'flagged', 'method': 'AI_BIOMETRIC',
      'marked_at': '2026-11-02T03:35:00', 'face_score': 1, 'liveness_score': null,
    };

    test('reads a history row, keeping a missing score missing rather than 0', () {
      final parsed = HistoryEntry.fromJson(json);
      expect(parsed.outcome, AttendanceOutcome.flagged);
      expect(parsed.faceScore, 1.0);
      expect(parsed.livenessScore, isNull);
      expect(parsed.canAddNote, isFalse);
      expect(parsed.markedAt!.toUtc(), DateTime.utc(2026, 11, 2, 3, 35));
    });

    test('an empty filter has no query beyond paging', () {
      const filter = HistoryFilter();
      expect(filter.isEmpty, isTrue);
      expect(filter.toQuery(limit: 20, offset: 40), {'limit': 20, 'offset': 40});
    });

    test('a filter becomes the query the server expects', () {
      final filter = HistoryFilter(
        from: DateTime.utc(2026, 11, 1),
        to: DateTime.utc(2026, 11, 7),
        courseSectionId: 'sec-1',
        outcome: AttendanceOutcome.absent,
      );
      expect(filter.toQuery(limit: 10, offset: 0), {
        'from': '2026-11-01', 'to': '2026-11-07', 'course_section_id': 'sec-1', 'status': 'ABSENT',
        'limit': 10, 'offset': 0,
      });
    });

    test('copyWith can clear parts of a filter', () {
      final filter = HistoryFilter(
        from: DateTime.utc(2026, 11, 1),
        to: DateTime.utc(2026, 11, 7),
        courseSectionId: 'sec-1',
        outcome: AttendanceOutcome.late,
      );
      final cleared = filter.copyWith(clearDates: true, clearSubject: true, clearOutcome: true);
      expect(cleared.isEmpty, isTrue);
    });
  });

  group('analytics', () {
    AttendanceFigures figures(Standing standing, double? pct) => AttendanceFigures(
      conducted: 10, attended: 5, percentage: pct, canMiss: 0, mustAttend: 0, standing: standing,
    );

    SubjectFigures subject(String name, Standing standing, double? pct) => SubjectFigures(
      courseSectionId: name, subjectName: name, subjectCode: name, classCode: 'k', teacherName: null,
      figures: figures(standing, pct),
    );

    test('parses every standing and refuses an unknown one', () {
      expect(Standing.parse('NO_DATA'), Standing.noData);
      expect(Standing.parse('OK'), Standing.ok);
      expect(Standing.parse('AT_RISK'), Standing.atRisk);
      expect(Standing.parse('SHORTAGE'), Standing.shortage);
      expect(() => Standing.parse('FINE'), throwsFormatException);
    });

    test('figures keep a missing percentage null, never 0 or 100', () {
      final parsed = AttendanceFigures.fromJson({'conducted': 0, 'attended': 0, 'percentage': null, 'standing': 'NO_DATA'});
      expect(parsed.percentage, isNull);
      expect(parsed.canMiss, 0);
    });

    test('lists subjects below the minimum, worst first', () {
      final analytics = StudentAnalytics(
        threshold: 75, atRiskMargin: 5, overall: figures(Standing.ok, 80),
        subjects: [
          subject('Physics', Standing.shortage, 60),
          subject('Maths', Standing.ok, 90),
          subject('Chemistry', Standing.shortage, 40),
        ],
        weeklyTrend: const [], currentStreak: 0, bestStreak: 0,
      );
      expect(analytics.shortages.map((s) => s.subjectName), ['Chemistry', 'Physics']);
      expect(analytics.thisWeek, isNull);
    });
  });
}
