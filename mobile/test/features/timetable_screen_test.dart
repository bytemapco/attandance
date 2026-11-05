import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/features/timetable/screens/timetable_screen.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

import '../helpers/fake_insights_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/screen_harness.dart';

const today = '2026-11-05'; // Thursday; the screen's clock reads 09:30 IST

Loaded<StudentTimetable> week(
  List<Map<String, dynamic>> entries, {
  DateTime? cachedAt,
}) {
  final json = timetableJson(entries);
  (json['days'] as List<dynamic>).first['date'] = today;
  return Loaded(StudentTimetable.fromJson(json), cachedAt: cachedAt);
}

Map<String, dynamic> cls(
  String subject,
  String start,
  String end, {
  String? occurrenceId,
  String status = 'SCHEDULED',
  String? attendanceStatus,
  bool windowOpen = false,
  String? windowClosesAt,
  String? cancellationReason,
  bool isSubstitute = false,
  bool isExtra = false,
}) => timetableEntryJson(
  subject: subject,
  date: today,
  start: start,
  end: end,
  occurrenceId: occurrenceId,
  status: status,
  attendanceStatus: attendanceStatus,
  windowOpen: windowOpen,
  windowClosesAt: windowClosesAt,
  cancellationReason: cancellationReason,
  isSubstitute: isSubstitute,
  isExtra: isExtra,
);

void main() {
  late FakeInsightsRepository repo;

  setUp(() => repo = FakeInsightsRepository());

  Future<void> open(WidgetTester tester) =>
      pumpScreen(tester, TimetableScreen(clock: fixedClock), repo);

  testWidgets('shows a placeholder while the week loads', (tester) async {
    repo.gate = Completer<void>();
    await open(tester);
    expect(find.byType(ShimmerPlaceholder), findsOneWidget);
    repo.gate?.complete();
  });

  testWidgets('lists the day in time order and marks the class happening now', (tester) async {
    repo.onTimetable = (_) => week([
      cls('Physics', '11:00', '12:00'),
      cls('Maths', '09:00', '10:00'),
    ]);
    await open(tester);
    expect(find.text('HAPPENING NOW'), findsOneWidget);
    expect(find.text('In progress'), findsOneWidget);
    expect(find.text('Upcoming'), findsOneWidget);
    final maths = tester.getTopLeft(find.text('Maths')).dy;
    final physics = tester.getTopLeft(find.text('Physics')).dy;
    expect(maths, lessThan(physics));
  });

  testWidgets('highlights the next class when none is running', (tester) async {
    repo.onTimetable = (_) => week([
      cls('Maths', '08:00', '09:00'),
      cls('Physics', '11:00', '12:00'),
      cls('Chemistry', '14:00', '15:00'),
    ]);
    await open(tester);
    expect(find.text('UP NEXT'), findsOneWidget);
    expect(find.text('HAPPENING NOW'), findsNothing);
    expect(find.text('Ended'), findsOneWidget);
  });

  testWidgets('offers marking only while the teacher\'s window is open', (tester) async {
    repo.onTimetable = (_) => week([
      cls(
        'Maths',
        '09:00',
        '10:00',
        occurrenceId: 'occ-1',
        windowOpen: true,
        windowClosesAt: '2026-11-05T04:20:00Z',
      ),
      cls('Physics', '11:00', '12:00'),
    ]);
    await open(tester);
    expect(find.text('Attendance open'), findsOneWidget);
    expect(find.text('Mark attendance'), findsOneWidget);
  });

  testWidgets('a window that has closed offers no marking, even from saved data', (tester) async {
    repo.onTimetable = (_) => week(
      [
        cls(
          'Maths',
          '09:00',
          '10:00',
          occurrenceId: 'occ-1',
          windowOpen: true,
          windowClosesAt: '2026-11-05T03:00:00Z',
        ),
      ],
      cachedAt: DateTime(2026, 11, 5, 8),
    );
    await open(tester);
    expect(find.text('Mark attendance'), findsNothing);
  });

  testWidgets('shows the outcome of a class the student already marked', (tester) async {
    repo.onTimetable = (_) => week([
      cls('Maths', '09:00', '10:00', occurrenceId: 'occ-1', attendanceStatus: 'LATE'),
    ]);
    await open(tester);
    expect(find.text('Late'), findsOneWidget);
    expect(find.text('Mark attendance'), findsNothing);
  });

  testWidgets('shows a cancelled class with its reason, and substitute and extra tags', (tester) async {
    repo.onTimetable = (_) => week([
      cls('Maths', '09:00', '10:00', status: 'CANCELLED', cancellationReason: 'Teacher on leave'),
      cls('Physics', '11:00', '12:00', isSubstitute: true),
      cls('Lab', '14:00', '15:00', isExtra: true),
    ]);
    await open(tester);
    expect(find.text('Cancelled'), findsOneWidget);
    expect(find.text('Teacher on leave'), findsOneWidget);
    expect(find.text('Substitute'), findsOneWidget);
    expect(find.text('Extra class'), findsOneWidget);
  });

  testWidgets('a day with no classes says so', (tester) async {
    await open(tester);
    expect(find.text('No classes on Thursday'), findsOneWidget);
  });

  testWidgets('a failed load with nothing saved shows the reason and retries', (tester) async {
    repo.failure = networkDown;
    await open(tester);
    expect(find.text(networkDown.message), findsOneWidget);
    repo.failure = null;
    repo.onTimetable = (_) => week([cls('Maths', '11:00', '12:00')]);
    await tester.tap(find.text('Retry'));
    await tester.pump();
    await tester.pump();
    expect(find.text('Maths'), findsOneWidget);
    expect(find.text(networkDown.message), findsNothing);
  });

  testWidgets('says when it is showing saved data', (tester) async {
    repo.onTimetable = (_) => week([cls('Maths', '11:00', '12:00')], cachedAt: DateTime(2026, 11, 5, 8, 15));
    await open(tester);
    expect(find.textContaining('You are offline'), findsOneWidget);
    expect(find.text('Maths'), findsOneWidget);
  });

  testWidgets('the previous-week button loads the week before', (tester) async {
    await open(tester);
    await tester.tap(find.byTooltip('Previous week'));
    await tester.pump();
    await tester.pump();
    expect(repo.timetableWeeks.last, DateTime.utc(2026, 10, 26));
    expect(find.text('Back to today'), findsOneWidget);
  });

  testWidgets('works on a small phone without overflow', (tester) async {
    repo.onTimetable = (_) => week([
      cls('Engineering Mathematics and Statistics', '09:00', '10:00', isSubstitute: true),
    ]);
    await pumpScreen(tester, TimetableScreen(clock: fixedClock), repo, size: const Size(320, 568));
    expect(tester.takeException(), isNull);
    expect(find.byType(Scrollable), findsWidgets);
  });
}
