import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/features/analytics/providers/analytics_provider.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/timetable/providers/timetable_provider.dart';

import 'fake_insights_repository.dart';
import 'pump_app.dart';

/// Thursday 5 Nov 2026, 09:30 IST.
DateTime fixedClock() => DateTime.utc(2026, 11, 5, 4, 0);

/// Shows [screen] with the three insight providers wired to [repo]. Auth and the websocket are
/// left out, so the screen only sees what the test gives it.
Future<void> pumpScreen(
  WidgetTester tester,
  Widget screen,
  FakeInsightsRepository repo, {
  Size size = const Size(390, 844),
}) async {
  disableFontFetching();
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        studentInsightsRepositoryProvider.overrideWithValue(repo),
        timetableProvider.overrideWith(
          (ref) => TimetableNotifier(repo, clock: fixedClock),
        ),
        historyProvider.overrideWith((ref) => HistoryNotifier(repo)),
        analyticsProvider.overrideWith((ref) => AnalyticsNotifier(repo)),
      ],
      child: MaterialApp(theme: buildSasTheme(), home: Scaffold(body: screen)),
    ),
  );
  // Take the screen down before the test ends so its timers do not outlive it.
  addTearDown(() => tester.pumpWidget(const SizedBox()));
  await tester.pump();
  await tester.pump();
}
