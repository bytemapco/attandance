import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/shared/widgets/status_chip.dart';

void main() {
  testWidgets('StatusChip renders label and responds to tap', (WidgetTester tester) async {
    var isTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatusChip(
            label: 'Present',
            color: Colors.green,
            onTap: () {
              isTapped = true;
            },
          ),
        ),
      ),
    );

    expect(find.text('Present'), findsOneWidget);

    await tester.tap(find.text('Present'));
    await tester.pump();

    expect(isTapped, isTrue);
  });
}

