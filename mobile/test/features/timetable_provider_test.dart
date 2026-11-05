import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/features/timetable/providers/timetable_provider.dart';

import '../helpers/fake_insights_repository.dart';
import '../helpers/fixtures.dart';

/// Thursday 5 Nov 2026, 10:00 IST.
DateTime clock() => DateTime.utc(2026, 11, 5, 4, 30);

TimetableNotifier notifier(FakeInsightsRepository repo) =>
    TimetableNotifier(repo, clock: clock);

void main() {
  late FakeInsightsRepository repo;

  setUp(() => repo = FakeInsightsRepository());

  test('starts on the current week with today selected', () {
    final state = notifier(repo).state;
    expect(state.weekStart, DateTime.utc(2026, 11, 2));
    expect(state.selectedDay, DateTime.utc(2026, 11, 5));
    expect(state.load.hasData, isFalse);
  });

  test('fetch loads the week', () async {
    repo.onTimetable = (_) => Loaded(
      StudentTimetable.fromJson(timetableJson([timetableEntryJson()])),
    );
    final n = notifier(repo);
    await n.fetch();
    expect(n.state.load.data!.days.single.entries, hasLength(1));
    expect(n.state.load.isLoading, isFalse);
    expect(n.state.load.errorMessage, isNull);
    expect(repo.timetableWeeks, [DateTime.utc(2026, 11, 2)]);
  });

  test('a saved copy is passed on with its time', () async {
    final saved = DateTime(2026, 11, 5, 8);
    repo.onTimetable = (_) => Loaded(
      StudentTimetable.fromJson(timetableJson([])),
      cachedAt: saved,
    );
    final n = notifier(repo);
    await n.fetch();
    expect(n.state.load.cachedAt, saved);
  });

  test('a failure with nothing to show is a blocking error', () async {
    repo.failure = networkDown;
    final n = notifier(repo);
    await n.fetch();
    expect(n.state.load.isBlockingError, isTrue);
    expect(n.state.load.errorMessage, networkDown.message);
  });

  test('a failed refresh keeps what was already on screen', () async {
    final n = notifier(repo);
    await n.fetch();
    repo.failure = networkDown;
    await n.fetch();
    expect(n.state.load.hasData, isTrue);
    expect(n.state.load.isBlockingError, isFalse);
    expect(n.state.load.errorMessage, networkDown.message);
  });

  test('the next week starts on its Monday', () async {
    final n = notifier(repo);
    await n.changeWeek(1);
    expect(n.state.weekStart, DateTime.utc(2026, 11, 9));
    expect(n.state.selectedDay, DateTime.utc(2026, 11, 9));
    expect(repo.timetableWeeks.last, DateTime.utc(2026, 11, 9));
  });

  test('going back and returning to this week selects today again', () async {
    final n = notifier(repo);
    await n.changeWeek(-1);
    expect(n.state.weekStart, DateTime.utc(2026, 10, 26));
    await n.changeWeek(1);
    expect(n.state.weekStart, DateTime.utc(2026, 11, 2));
    expect(n.state.selectedDay, DateTime.utc(2026, 11, 5));
  });

  test('goToToday returns to this week and today', () async {
    final n = notifier(repo);
    await n.changeWeek(3);
    await n.goToToday();
    expect(n.state.weekStart, DateTime.utc(2026, 11, 2));
    expect(n.state.selectedDay, DateTime.utc(2026, 11, 5));
  });

  test('selecting a day only changes the selection', () async {
    final n = notifier(repo);
    n.selectDay(DateTime.utc(2026, 11, 3));
    expect(n.state.selectedDay, DateTime.utc(2026, 11, 3));
    expect(repo.timetableWeeks, isEmpty);
  });

  test('an answer for a week the student already left is ignored', () async {
    final n = notifier(repo);
    final gate = Completer<void>();
    repo.gate = gate;
    final slow = n.fetch(); // this week, waiting
    await Future<void>.delayed(Duration.zero);
    repo.onTimetable = (week) => Loaded(
      StudentTimetable.fromJson(
        timetableJson([timetableEntryJson(subject: 'Next week')]),
      ),
    );
    await n.changeWeek(1);
    gate.complete();
    await slow;
    expect(n.state.weekStart, DateTime.utc(2026, 11, 9));
    expect(n.state.load.data!.days.single.entries.single.subjectName, 'Next week');
  });

  test('reset goes back to the start', () async {
    final n = notifier(repo);
    await n.changeWeek(2);
    n.reset();
    expect(n.state.weekStart, DateTime.utc(2026, 11, 2));
    expect(n.state.load.hasData, isFalse);
  });
}
