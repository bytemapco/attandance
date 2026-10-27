import 'package:flutter/material.dart';

import 'design_tokens.dart';

ThemeData buildAppTheme(Brightness brightness, Color seed) {
  final scheme = ColorScheme.fromSeed(seedColor: seed, brightness: brightness);

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    extensions: const <ThemeExtension<dynamic>>[AppSpacing()],
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerLowest,
      border: const OutlineInputBorder(),
    ),
  );
}
