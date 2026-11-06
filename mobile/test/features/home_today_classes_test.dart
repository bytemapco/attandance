import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/home_today_classes_card.dart';
import 'package:smart_attendance_app/shared/load_state.dart';

// 10:30 IST on Friday 6 Nov 2026.
final clock = DateTime.utc(2026, 11, 6, 5, 0);

TimetableEntry entry(String subject, String start, String end) =>
    TimetableEntry(
      occurrenceId: null,
      courseSectionId: 'sec-$subject',
      subjectName: subject,
      subjectCode: 'C-$subject',
      classCode: 'CSE-A-1',
      date: istDay(istNow(clock)),
      startTime: start,
      endTime: end,
      classroomName: 'A-101',
      teacherName: 'Meenakshi Iyer',
      status: 'SCHEDULED',
      cancellationReason: null,
      isSubstitute: false,
      isExtra: false,
      outcome: null,
      windowOpen: false,
      windowClosesAt: null,
    );

LoadState<StudentTimetable> week(List<TimetableEntry> today) => LoadState(
  data: StudentTimetable(
    days: [TimetableDay(date: istDay(istNow(clock)), entries: today)],
  ),
);

const enrolled = SessionState(
  sessions: [
    ClassSession(
      classId: 'sec-1',
      className: 'CSE-A-1',
      subject: 'Data Structures',
      teacherName: 'Meenakshi Iyer',
    ),
  ],
);

Future<void> show(
  WidgetTester tester, {
  required SessionState classes,
  required LoadState<StudentTimetable> timetable,
  VoidCallback? onRetry,
}) => tester.pumpWidget(
  MaterialApp(
    home: Scaffold(
      body: SingleChildScrollView(
        child: HomeTodayClassesCard(
          classes: classes,
          timetable: timetable,
          clock: clock,
          onViewAll: () {},
          onSmartPass: () {},
          onFaceMatch: () {},
          onMark: (_) {},
          onRetry: onRetry,
        ),
      ),
    ),
  ),
);

void main() {
  testWidgets('lists the classes the timetable has for today', (tester) async {
    await show(
      tester,
      classes: enrolled,
      timetable: week([
        entry('Data Structures', '09:00', '09:55'),
        entry('Discrete Mathematics', '10:00', '10:55'),
      ]),
    );

    expect(find.text('Data Structures'), findsOneWidget);
    expect(find.text('Discrete Mathematics'), findsOneWidget);
    expect(find.text('No Classes Scheduled Today'), findsNothing);
  });

  testWidgets('tells a student who is in no class to ask their admin', (
    tester,
  ) async {
    await show(
      tester,
      classes: const SessionState(),
      timetable: week(const []),
    );

    expect(find.text("You're not in a class yet"), findsOneWidget);
    expect(find.textContaining('Ask your institution admin'), findsOneWidget);
  });

  testWidgets('says a free day is free when the student has classes', (
    tester,
  ) async {
    await show(tester, classes: enrolled, timetable: week(const []));

    expect(find.text('No Classes Scheduled Today'), findsOneWidget);
    expect(find.text("You're not in a class yet"), findsNothing);
  });

  testWidgets('does not claim anything before the timetable has loaded', (
    tester,
  ) async {
    await show(
      tester,
      classes: const SessionState(),
      timetable: const LoadState(),
    );

    expect(find.text("You're not in a class yet"), findsNothing);
    expect(find.text('No Classes Scheduled Today'), findsNothing);
  });

  testWidgets('offers a retry when the timetable cannot be loaded', (
    tester,
  ) async {
    var retried = 0;
    await show(
      tester,
      classes: enrolled,
      timetable: const LoadState<StudentTimetable>().failed(
        'Unable to reach the server.',
      ),
      onRetry: () => retried++,
    );

    expect(find.text('Unable to reach the server.'), findsOneWidget);
    await tester.tap(find.text('Retry'));
    expect(retried, 1);
  });
}
