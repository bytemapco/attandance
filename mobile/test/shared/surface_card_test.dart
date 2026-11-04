import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';
import '../helpers/pump_app.dart';

void main() {
  setUpAll(disableFontFetching);

  testWidgets('renders its child and no shadow', (tester) async {
    await pumpThemed(tester, const SurfaceCard(child: Text('Session')));

    expect(find.text('Session'), findsOneWidget);
    final decorated = tester.widgetList<Container>(find.byType(Container));
    for (final container in decorated) {
      final decoration = container.decoration;
      if (decoration is BoxDecoration) {
        expect(decoration.boxShadow, isNull);
      }
    }
  });

  testWidgets('is tappable when onTap is given', (tester) async {
    var taps = 0;
    await pumpThemed(
      tester,
      SurfaceCard(onTap: () => taps++, child: const Text('Open')),
    );

    await tester.tap(find.text('Open'));
    expect(taps, 1);
  });

  testWidgets('uses the 12px radius from the design tokens', (tester) async {
    await pumpThemed(tester, const SurfaceCard(child: Text('x')));

    final ink = tester.widget<Container>(
      find.descendant(of: find.byType(SurfaceCard), matching: find.byType(Container)).first,
    );
    final decoration = ink.decoration as BoxDecoration;
    expect(decoration.borderRadius, BorderRadius.circular(12));
  });
}
