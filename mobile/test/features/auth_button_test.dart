import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_button.dart';
import '../helpers/pump_app.dart';

void main() {
  setUpAll(disableFontFetching);

  testWidgets('shows label with arrow and fires onPressed', (tester) async {
    var taps = 0;
    await pumpThemed(tester, AuthButton(label: 'Continue', onPressed: () => taps++));

    expect(find.text('Continue'), findsOneWidget);
    expect(find.byIcon(Icons.arrow_forward_rounded), findsOneWidget);
    await tester.tap(find.text('Continue'));
    expect(taps, 1);
  });

  testWidgets('loading shows a spinner in place of the arrow', (tester) async {
    await pumpThemed(
      tester,
      AuthButton(label: 'Continue', isLoading: true, onPressed: () {}),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.byIcon(Icons.arrow_forward_rounded), findsNothing);
  });
}
