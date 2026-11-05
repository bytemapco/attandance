import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/features/analytics/providers/analytics_provider.dart';
import 'package:smart_attendance_app/features/analytics/screens/analytics_screen.dart';

import '../helpers/fake_insights_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/screen_harness.dart';

Loaded<StudentAnalytics> loaded(Map<String, dynamic> json, {DateTime? cachedAt}) =>
    Loaded(StudentAnalytics.fromJson(json), cachedAt: cachedAt);

Map<String, dynamic> subject(String name, double pct, String standing, {int mustAttend = 0}) => {
  ...figuresJson(percentage: pct, standing: standing, canMiss: 0, mustAttend: mustAttend),
  'course_section_id': name,
  'subject_name': name,
  'subject_code': name.toUpperCase(),
  'class_code': 'CE-A',
  'teacher_name': 'Asha Rao',
};

void main() {
  late FakeInsightsRepository repo;

  setUp(() => repo = FakeInsightsRepository());

  Future<void> open(WidgetTester tester, {Size? size}) => pumpScreen(
    tester,
    const AnalyticsScreen(),
    repo,
    size: size ?? const Size(390, 844),
  );

  testWidgets('shows the overall figure, the summary and the streaks', (tester) async {
    await open(tester);
    expect(find.text('90%'), findsWidgets);
    expect(find.text('On track'), findsOneWidget);
    expect(find.textContaining('You are above the 75% minimum'), findsOneWidget);
    expect(find.text('18 of 20 classes'), findsWidgets);
    expect(find.text('3'), findsWidgets); // current streak
    expect(find.text('7'), findsOneWidget); // best streak
    expect(find.text('3/4'), findsOneWidget); // this week
  });

  testWidgets('lists each subject with what the student can do about it', (tester) async {
    await open(tester);
    await tester.scrollUntilVisible(find.text('Maths'), 300);
    expect(find.text('Maths'), findsOneWidget);
    expect(find.text('Can miss 4 classes'), findsOneWidget);
  });

  testWidgets('warns about subjects below the minimum', (tester) async {
    repo.onAnalytics = () => loaded(
      analyticsJson(
        overall: figuresJson(percentage: 60, canMiss: 0, mustAttend: 12, standing: 'SHORTAGE'),
        subjects: [subject('Physics', 55, 'SHORTAGE', mustAttend: 5), subject('Maths', 90, 'OK')],
      ),
    );
    await open(tester);
    expect(find.text('Shortage'), findsOneWidget);
    expect(find.text('Below the 75% minimum in Physics.'), findsOneWidget);
    expect(find.textContaining('Attending the next 12 classes in a row'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Attend the next 5 classes to recover'), 300);
  });

  testWidgets('before any class there is a dash, not 0%', (tester) async {
    repo.onAnalytics = () => loaded(
      analyticsJson(
        overall: figuresJson(conducted: 0, attended: 0, percentage: null, canMiss: 0, standing: 'NO_DATA'),
        subjects: [],
        trend: [],
      ),
    );
    await open(tester);
    expect(find.text('–'), findsWidgets);
    expect(find.text('0%'), findsNothing);
    expect(find.text('No classes yet'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('No subjects yet'), 300);
  });

  testWidgets('shows the reason when loading fails and retries', (tester) async {
    repo.failure = networkDown;
    await open(tester);
    expect(find.text(networkDown.message), findsOneWidget);
    repo.failure = null;
    await tester.tap(find.text('Retry'));
    await tester.pump();
    await tester.pump();
    expect(find.text(networkDown.message), findsNothing);
    expect(find.text('On track'), findsOneWidget);
  });

  testWidgets('says when it is showing saved data', (tester) async {
    repo.onAnalytics = () => loaded(analyticsJson(), cachedAt: DateTime(2026, 11, 5, 8, 15));
    await open(tester);
    expect(find.textContaining('You are offline'), findsOneWidget);
    expect(find.text('90%'), findsWidgets);
  });

  testWidgets('keeps the figures on screen when a refresh fails', (tester) async {
    await open(tester);
    repo.failure = networkDown;
    await tester.runAsync(() => Future<void>.delayed(Duration.zero));
    final context = tester.element(find.byType(AnalyticsScreen));
    final container = ProviderScope.containerOf(context);
    await container.read(analyticsProvider.notifier).fetch();
    await tester.pump();
    expect(find.textContaining('Could not refresh'), findsOneWidget);
    expect(find.text('On track'), findsOneWidget);
  });

  testWidgets('works on a small phone without overflow', (tester) async {
    await open(tester, size: const Size(320, 568));
    expect(tester.takeException(), isNull);
  });
}
