import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Keeps tests offline: fonts fall back to the platform font instead of downloading.
void disableFontFetching() {
  GoogleFonts.config.allowRuntimeFetching = false;
}

/// Pumps [child] inside the app theme in the requested brightness.
Future<void> pumpThemed(
  WidgetTester tester,
  Widget child, {
  Brightness brightness = Brightness.light,
}) {
  return tester.pumpWidget(
    MaterialApp(
      theme: buildSasTheme(brightness: brightness),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}
