import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';
import '../helpers/pump_app.dart';

void main() {
  setUpAll(disableFontFetching);

  testWidgets('shows its label and calls onPressed when tapped', (tester) async {
    var taps = 0;
    await pumpThemed(tester, AppButton(label: 'Save', onPressed: () => taps++));

    expect(find.text('Save'), findsOneWidget);
    await tester.tap(find.text('Save'));
    expect(taps, 1);
  });

  testWidgets('does not respond when onPressed is null', (tester) async {
    await pumpThemed(tester, const AppButton(label: 'Save'));

    final opacity = tester.widget<AnimatedOpacity>(find.byType(AnimatedOpacity));
    expect(opacity.opacity, lessThan(1.0), reason: 'disabled buttons are dimmed');
  });

  testWidgets('loading keeps the label, shows a spinner and blocks taps', (tester) async {
    var taps = 0;
    await pumpThemed(
      tester,
      AppButton(label: 'Save', isLoading: true, onPressed: () => taps++),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Save'), findsOneWidget, reason: 'label stays for stable layout');
    await tester.tap(find.text('Save'));
    expect(taps, 0);
  });

  testWidgets('primary and danger variants render without errors', (tester) async {
    for (final variant in AppButtonVariant.values) {
      await pumpThemed(
        tester,
        AppButton(label: variant.name, variant: variant, onPressed: () {}),
      );
      expect(find.text(variant.name), findsOneWidget);
    }
  });
}
