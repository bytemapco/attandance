import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/app/theme.dart';

void main() {
  group('Theme Contrast & Color Tokens', () {
    testWidgets(
      'textPrimaryOf provides dark navy in light mode and brilliance in dark mode',
      (tester) async {
        late Color lightText;
        late Color darkText;

        await tester.pumpWidget(
          Theme(
            data: ThemeData(brightness: Brightness.light),
            child: Builder(
              builder: (ctx) {
                lightText = SasColors.textPrimaryOf(ctx);
                return const SizedBox.shrink();
              },
            ),
          ),
        );

        await tester.pumpWidget(
          Theme(
            data: ThemeData(brightness: Brightness.dark),
            child: Builder(
              builder: (ctx) {
                darkText = SasColors.textPrimaryOf(ctx);
                return const SizedBox.shrink();
              },
            ),
          ),
        );

        expect(lightText, const Color(0xFF0F172A));
        expect(darkText, SasColors.brilliance);
      },
    );

    testWidgets('textSecondaryOf provides accessible slate-300 in dark mode', (
      tester,
    ) async {
      late Color lightSec;
      late Color darkSec;

      await tester.pumpWidget(
        Theme(
          data: ThemeData(brightness: Brightness.light),
          child: Builder(
            builder: (ctx) {
              lightSec = SasColors.textSecondaryOf(ctx);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      await tester.pumpWidget(
        Theme(
          data: ThemeData(brightness: Brightness.dark),
          child: Builder(
            builder: (ctx) {
              darkSec = SasColors.textSecondaryOf(ctx);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(lightSec, const Color(0xFF334155));
      expect(darkSec, const Color(0xFFCBD5E1));
    });

    testWidgets('textMutedOf provides accessible contrast in both modes', (
      tester,
    ) async {
      late Color lightMuted;
      late Color darkMuted;

      await tester.pumpWidget(
        Theme(
          data: ThemeData(brightness: Brightness.light),
          child: Builder(
            builder: (ctx) {
              lightMuted = SasColors.textMutedOf(ctx);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      await tester.pumpWidget(
        Theme(
          data: ThemeData(brightness: Brightness.dark),
          child: Builder(
            builder: (ctx) {
              darkMuted = SasColors.textMutedOf(ctx);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(lightMuted, const Color(0xFF475569));
      expect(darkMuted, const Color(0xFF94A3B8));
    });
  });
}
