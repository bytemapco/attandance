import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';

import '../helpers/fake_insights_repository.dart';
import '../helpers/fixtures.dart';

Loaded<HistoryPage> page(
  List<String> ids, {
  int total = 0,
  bool hasMore = false,
  DateTime? cachedAt,
}) => Loaded(
  HistoryPage.fromJson(
    historyPageJson(
      [for (final id in ids) historyEntryJson(occurrenceId: id)],
      total: total,
      hasMore: hasMore,
    ),
  ),
  cachedAt: cachedAt,
);

void main() {
  late FakeInsightsRepository repo;
  late HistoryNotifier notifier;

  setUp(() {
    repo = FakeInsightsRepository();
    notifier = HistoryNotifier(repo);
  });

  test('fetch loads the first page', () async {
    repo.onHistory = (_, _) => page(['a', 'b'], total: 5, hasMore: true);
    await notifier.fetch();
    expect(notifier.state.items.map((e) => e.occurrenceId), ['a', 'b']);
    expect((notifier.state.total, notifier.state.hasMore), (5, true));
    expect(notifier.state.isLoading, isFalse);
  });

  test('loadMore asks for the next offset and appends', () async {
    repo.onHistory = (_, offset) => offset == 0
        ? page(['a', 'b'], total: 3, hasMore: true)
        : page(['c'], total: 3);
    await notifier.fetch();
    await notifier.loadMore();
    expect(notifier.state.items.map((e) => e.occurrenceId), ['a', 'b', 'c']);
    expect(notifier.state.hasMore, isFalse);
    expect(repo.historyCalls.last.offset, 2);
  });

  test('loadMore does nothing when there is no more', () async {
    repo.onHistory = (_, _) => page(['a']);
    await notifier.fetch();
    await notifier.loadMore();
    expect(repo.historyCalls, hasLength(1));
  });

  test('a failed next page keeps the pages already shown', () async {
    repo.onHistory = (_, _) => page(['a'], total: 2, hasMore: true);
    await notifier.fetch();
    repo.failure = networkDown;
    await notifier.loadMore();
    expect(notifier.state.items, hasLength(1));
    expect(notifier.state.moreErrorMessage, networkDown.message);
    expect(notifier.state.isLoadingMore, isFalse);
    expect(notifier.state.hasMore, isTrue);
  });

  test('a new filter drops the old rows at once and reloads from the start', () async {
    repo.onHistory = (filter, _) =>
        page(filter.outcome == null ? ['a', 'b'] : ['x']);
    await notifier.fetch();
    final reload = notifier.setFilter(
      const HistoryFilter(outcome: AttendanceOutcome.late),
    );
    expect(notifier.state.items, isEmpty);
    await reload;
    expect(notifier.state.items.map((e) => e.occurrenceId), ['x']);
    expect(repo.historyCalls.last.filter.outcome, AttendanceOutcome.late);
    expect(repo.historyCalls.last.offset, 0);
  });

  test('an answer for a filter the student already left is ignored', () async {
    final gate = Completer<void>();
    repo.gate = gate;
    repo.onHistory = (filter, _) => page(filter.isEmpty ? ['old'] : ['new']);
    final slow = notifier.fetch();
    await Future<void>.delayed(Duration.zero);
    await notifier.setFilter(const HistoryFilter(outcome: AttendanceOutcome.absent));
    gate.complete();
    await slow;
    expect(notifier.state.items.map((e) => e.occurrenceId), ['new']);
  });

  test('the saved copy is marked with when it was saved', () async {
    final saved = DateTime(2026, 11, 5, 9);
    repo.onHistory = (_, _) => page(['a'], cachedAt: saved);
    await notifier.fetch();
    expect(notifier.state.cachedAt, saved);
    repo.onHistory = (_, _) => page(['a']);
    await notifier.fetch();
    expect(notifier.state.cachedAt, isNull);
  });

  test('nothing to show and no connection is a blocking error', () async {
    repo.failure = networkDown;
    await notifier.fetch();
    expect(notifier.state.isBlockingError, isTrue);
  });

  test('no classes is an empty state, not an error', () async {
    await notifier.fetch();
    expect(notifier.state.isEmpty, isTrue);
    expect(notifier.state.isBlockingError, isFalse);
  });

  test('reset returns to the starting filter', () async {
    final subject = HistoryNotifier(
      repo,
      initialFilter: const HistoryFilter(courseSectionId: 'sec-1'),
    );
    await subject.setFilter(const HistoryFilter());
    subject.reset();
    expect(subject.state.filter.courseSectionId, 'sec-1');
    expect(subject.state.items, isEmpty);
  });
}
