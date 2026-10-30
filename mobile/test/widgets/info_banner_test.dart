import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/shared/widgets/info_banner.dart';

void main() {
  group('InfoBanner Widget', () {
    testWidgets('renders message and custom action button when provided', (
      WidgetTester tester,
    ) async {
      var actionTriggered = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: InfoBanner(
              message: 'Location permission is required to check in',
              severity: BannerSeverity.warning,
              actionLabel: 'Grant Access',
              onAction: () {
                actionTriggered = true;
              },
            ),
          ),
        ),
      );

      expect(
        find.text('Location permission is required to check in'),
        findsOneWidget,
      );
      expect(find.text('Grant Access'), findsOneWidget);

      await tester.tap(find.text('Grant Access'));
      await tester.pump();

      expect(actionTriggered, isTrue);
    });

    testWidgets('renders banner without action button when onAction is null', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoBanner(
              message: 'All sessions are complete for today',
              severity: BannerSeverity.success,
            ),
          ),
        ),
      );

      expect(find.text('All sessions are complete for today'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsNothing);
    });
  });
}
