import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/shared/widgets/stat_tile.dart';

void main() {
  group('StatTile Widget', () {
    testWidgets('renders value and label correctly across variants', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatTile(
              label: 'Attendance Rate',
              value: '95.2%',
              color: Colors.green,
              icon: Icons.check_circle,
              variant: StatTileVariant.compact,
            ),
          ),
        ),
      );

      expect(find.text('95.2%'), findsOneWidget);
      expect(find.text('Attendance Rate'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('triggers onTap callback when tapped in compact variant', (
      WidgetTester tester,
    ) async {
      var wasTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatTile(
              label: 'Classes Attended',
              value: '42',
              color: Colors.blue,
              onTap: () {
                wasTapped = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('42'));
      await tester.pump();

      expect(wasTapped, isTrue);
    });
  });
}
