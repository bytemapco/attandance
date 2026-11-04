import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/app/theme.dart';

double _contrast(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  final hi = la > lb ? la : lb;
  final lo = la > lb ? lb : la;
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  group('SasColors brand tokens', () {
    test('carbon and copper are the brand kit values', () {
      expect(SasColors.carbon, const Color(0xFF28363B));
      expect(SasColors.copper, const Color(0xFFC98260));
      expect(SasColors.ivory, const Color(0xFFF5F2ED));
    });

    test('no legacy orange-on-navy palette remains', () {
      const legacy = [0xFFF95721, 0xFFFF8A00, 0xFF0F172A, 0xFF1E293B];
      for (final value in legacy) {
        final used = [
          SasColors.carbon,
          SasColors.copper,
          SasColors.ivory,
          SasColors.ink,
          SasColors.darkCanvas,
          SasColors.darkSurface,
          SasColors.lightCanvas,
          SasColors.lightSurface,
        ].map((c) => c.toARGB32());
        expect(used, isNot(contains(value)), reason: 'legacy $value in use');
      }
    });
  });

  group('text contrast (WCAG AA, 4.5:1 for body text)', () {
    test('light theme: primary, secondary and muted text on canvas', () {
      expect(_contrast(SasColors.ink, SasColors.lightCanvas), greaterThanOrEqualTo(4.5));
      expect(_contrast(SasColors.textSecondary, SasColors.lightCanvas), greaterThanOrEqualTo(4.5));
      expect(_contrast(SasColors.textMuted, SasColors.lightCanvas), greaterThanOrEqualTo(4.5));
    });

    test('light theme: primary text on white surface', () {
      expect(_contrast(SasColors.ink, SasColors.lightSurface), greaterThanOrEqualTo(4.5));
    });

    test('dark theme: primary and muted text on dark surface', () {
      expect(_contrast(SasColors.ivory, SasColors.darkSurface), greaterThanOrEqualTo(4.5));
      expect(_contrast(SasColors.mutedOnDark, SasColors.darkSurface), greaterThanOrEqualTo(4.5));
    });

    test('white text on carbon buttons', () {
      expect(_contrast(Colors.white, SasColors.carbon), greaterThanOrEqualTo(4.5));
    });
  });
}
