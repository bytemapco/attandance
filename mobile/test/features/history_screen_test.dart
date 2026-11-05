import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/features/history/screens/history_screen.dart';
import 'package:smart_attendance_app/features/history/screens/subject_detail_screen.dart';

import '../helpers/fake_insights_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/screen_harness.dart';

Loaded<HistoryPage> entries(
  List<Map<String, dynamic>> items, {
  int total = 0,
  bool hasMore = false,
  DateTime? cachedAt,
}) => Loaded(
  HistoryPage.fromJson(historyPageJson(items, total: total, hasMore: hasMore)),
  cachedAt: cachedAt,
);

void main() {
  late FakeInsightsRepository repo;

  setUp(() => repo = FakeInsightsRepository());

  Future<void> open(WidgetTester tester) =>
      pumpScreen(tester, const HistoryScreen(), repo);

  testWidgets('groups classes by day with their outcomes', (tester) async {
    repo.onHistory = (_, _) => entries([
      historyEntryJson(occurrenceId: 'a', date: '2026-11-03'),
      historyEntryJson(occurrenceId: 'b', date: '2026-11-03', status: 'ABSENT'),
      historyEntryJson(occurrenceId: 'c', date: '2026-11-02', status: 'LATE'),
    ]);
    await open(tester);
    expect(find.text('Tue, 3 Nov 2026'), findsOneWidget);
    expect(find.text('2 classes · 1 absent'), findsOneWidget);
    expect(find.text('Mon, 2 Nov 2026'), findsOneWidget);
    expect(find.text('Present'), findsOneWidget);
    expect(find.text('Absent'), findsOneWidget);
    expect(find.text('Late'), findsOneWidget);
    expect(find.text('3 classes'), findsOneWidget);
    expect(find.text('1 class'), findsOneWidget);
  });

  testWidgets('says so when there are no classes yet', (tester) async {
    await open(tester);
    expect(find.text('No classes yet'), findsOneWidget);
  });

  testWidgets('shows the reason when loading fails and retries', (tester) async {
    repo.failure = networkDown;
    await open(tester);
    expect(find.text(networkDown.message), findsOneWidget);
    repo.failure = null;
    repo.onHistory = (_, _) => entries([historyEntryJson()]);
    await tester.tap(find.text('Retry'));
    await tester.pump();
    await tester.pump();
    expect(find.text('Present'), findsOneWidget);
  });

  testWidgets('says when it is showing saved data', (tester) async {
    repo.onHistory = (_, _) =>
        entries([historyEntryJson()], cachedAt: DateTime(2026, 11, 5, 8, 15));
    await open(tester);
    expect(find.textContaining('You are offline'), findsOneWidget);
  });

  testWidgets('filtering by status reloads and can be cleared', (tester) async {
    repo.onHistory = (filter, _) => filter.outcome == null
        ? entries([
            historyEntryJson(occurrenceId: 'a', date: '2026-11-03'),
            historyEntryJson(occurrenceId: 'b', date: '2026-11-02', status: 'LATE'),
          ])
        : entries([historyEntryJson(occurrenceId: 'b', date: '2026-11-02', status: 'LATE')]);
    await open(tester);
    expect(find.text('2 classes'), findsOneWidget);

    await tester.tap(find.text('All statuses'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Late').last);
    await tester.pumpAndSettle();
    expect(repo.historyCalls.last.filter.outcome, AttendanceOutcome.late);
    expect(find.text('1 class match'), findsOneWidget);

    await tester.tap(find.text('Clear'));
    await tester.pumpAndSettle();
    expect(repo.historyCalls.last.filter.isEmpty, isTrue);
    expect(find.text('2 classes'), findsOneWidget);
  });

  testWidgets('a filter that matches nothing explains how to widen it', (tester) async {
    repo.onHistory = (filter, _) =>
        filter.outcome == null ? entries([historyEntryJson()]) : entries([]);
    await open(tester);
    await tester.tap(find.text('All statuses'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Absent').last);
    await tester.pumpAndSettle();
    expect(find.text('Nothing matches'), findsOneWidget);
  });

  testWidgets('Show more loads the next page', (tester) async {
    repo.onHistory = (_, offset) => offset == 0
        ? entries([historyEntryJson(occurrenceId: 'a', date: '2026-11-03')], total: 2, hasMore: true)
        : entries([historyEntryJson(occurrenceId: 'b', date: '2026-11-02')], total: 2);
    await open(tester);
    expect(find.text('Mon, 2 Nov 2026'), findsNothing);
    await tester.ensureVisible(find.textContaining('Show more'));
    await tester.tap(find.textContaining('Show more'));
    await tester.pump();
    await tester.pump();
    expect(find.text('Mon, 2 Nov 2026'), findsOneWidget);
    expect(find.textContaining('Show more'), findsNothing);
  });

  testWidgets('opening a class shows how it was marked', (tester) async {
    repo.onHistory = (_, _) => entries([historyEntryJson()]);
    await open(tester);
    await tester.tap(find.text('Maths'));
    await tester.pumpAndSettle();
    expect(find.text('Class QR code'), findsOneWidget);
    expect(find.text('Monday, 2 November 2026'), findsOneWidget);
  });

  testWidgets('a pending-review class offers the review screen', (tester) async {
    repo.onHistory = (_, _) => entries([historyEntryJson(status: 'FLAGGED')]);
    await open(tester);
    await tester.tap(find.text('Maths'));
    await tester.pumpAndSettle();
    expect(find.text('Review and add a note'), findsOneWidget);
  });

  testWidgets('the subject screen shows its figures and its classes', (tester) async {
    repo.onHistory = (filter, _) {
      expect(filter.courseSectionId, 'sec-1');
      return entries([historyEntryJson()]);
    };
    await pumpScreen(tester, const SubjectDetailScreen(courseSectionId: 'sec-1'), repo);
    expect(find.text('90%'), findsOneWidget);
    expect(find.text('Can miss 4 classes'), findsOneWidget);
    expect(find.text('Present'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('works on a small phone without overflow', (tester) async {
    repo.onHistory = (_, _) => entries([historyEntryJson()], total: 40, hasMore: true);
    await pumpScreen(tester, const HistoryScreen(), repo, size: const Size(320, 568));
    expect(tester.takeException(), isNull);
  });
}
