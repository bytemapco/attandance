import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/shared/widgets/loading_overlay.dart';
import '../helpers/pump_app.dart';

void main() {
  setUpAll(disableFontFetching);

  testWidgets('shows spinner and message, and has no blur', (tester) async {
    await pumpThemed(tester, const LoadingOverlay(message: 'Signing in...'));

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Signing in...'), findsOneWidget);
    expect(find.byType(BackdropFilter), findsNothing);
  });
}
