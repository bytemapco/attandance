import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/exceptions.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';

import 'fixtures.dart';

/// A repository the test controls: answers can be set, delayed with a completer, or made to fail.
class FakeInsightsRepository extends Fake implements StudentInsightsRepository {
  Loaded<StudentTimetable> Function(DateTime week) onTimetable = (_) =>
      Loaded(StudentTimetable.fromJson(timetableJson([])));
  Loaded<HistoryPage> Function(HistoryFilter filter, int offset) onHistory =
      (_, _) => Loaded(HistoryPage.fromJson(historyPageJson([])));
  Loaded<StudentAnalytics> Function() onAnalytics = () =>
      Loaded(StudentAnalytics.fromJson(analyticsJson()));

  /// When set, every call fails with it.
  Object? failure;

  /// When set, the next call waits for it before answering.
  Completer<void>? gate;

  final timetableWeeks = <DateTime>[];
  final historyCalls = <({HistoryFilter filter, int offset})>[];
  int analyticsCalls = 0;

  Future<void> _enter() async {
    final pending = gate;
    gate = null;
    if (pending != null) await pending.future;
    final error = failure;
    if (error != null) throw error;
  }

  @override
  Future<Loaded<StudentTimetable>> timetable(DateTime weekStart) async {
    timetableWeeks.add(weekStart);
    await _enter();
    return onTimetable(weekStart);
  }

  @override
  Future<Loaded<HistoryPage>> history(
    HistoryFilter filter, {
    int offset = 0,
  }) async {
    historyCalls.add((filter: filter, offset: offset));
    await _enter();
    return onHistory(filter, offset);
  }

  @override
  Future<Loaded<StudentAnalytics>> analytics() async {
    analyticsCalls++;
    await _enter();
    return onAnalytics();
  }
}

const networkDown = NetworkException('Unable to reach the server.');
