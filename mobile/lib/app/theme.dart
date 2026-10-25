import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SasColors {
  SasColors._();

  static const Color bgPrimary = Color(0xFFF8FAFC);
  static const Color bgCanvas = Color(0xFFF8FAFC);
  static const Color bgSecondary = Color(0xFFFFFFFF);
  static const Color bgSurface = Color(0xFFF1F5F9);

  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF334155);
  static const Color textMuted = Color(0xFF64748B);

  static const Color accentEmerald = Color(0xFF059669);
  static const Color accentTeal = Color(0xFF0D9488);
  static const Color accentPink = Color(0xFFDC2626);
  static const Color accentAmber = Color(0xFFD97706);

  static const Color glassBg = Color(0xFFFFFFFF);
  static const Color glassBgHover = Color(0xFFF8FAFC);
  static const Color glassBorder = Color(0xFFE2E8F0);
  static const Color glassBorderHover = Color(0xFFCBD5E1);

  static const Color success = Color(0xFF059669);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);
}

class SasSpacing {
  SasSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;

  static const EdgeInsets screenPadding = EdgeInsets.all(xl);
}

class SasRadius {
  SasRadius._();

  static const double sm = 6;
  static const double md = 10;
  static const double lg = 14;
  static const double xl = 18;

  static BorderRadius get smAll => BorderRadius.circular(sm);
  static BorderRadius get mdAll => BorderRadius.circular(md);
  static BorderRadius get lgAll => BorderRadius.circular(lg);
  static BorderRadius get xlAll => BorderRadius.circular(xl);
}

class SasDurations {
  SasDurations._();

  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);
}

ThemeData buildSasTheme() {
  final baseText = GoogleFonts.interTextTheme(
    ThemeData.light().textTheme,
  );

  return ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: SasColors.bgPrimary,
    colorScheme: const ColorScheme.light(
      primary: SasColors.accentEmerald,
      secondary: SasColors.accentTeal,
      surface: SasColors.bgSecondary,
      error: SasColors.danger,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: SasColors.textPrimary,
      onError: Colors.white,
    ),
    textTheme: baseText.copyWith(
      displayLarge: baseText.displayLarge?.copyWith(
        letterSpacing: -0.02,
        fontWeight: FontWeight.w700,
        color: SasColors.textPrimary,
      ),
      headlineMedium: baseText.headlineMedium?.copyWith(
        letterSpacing: -0.02,
        fontWeight: FontWeight.w700,
        color: SasColors.textPrimary,
      ),
      titleLarge: baseText.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        color: SasColors.textPrimary,
        letterSpacing: -0.01,
      ),
      titleMedium: baseText.titleMedium?.copyWith(
        fontWeight: FontWeight.w600,
        color: SasColors.textPrimary,
      ),
      bodyLarge: baseText.bodyLarge?.copyWith(
        color: SasColors.textPrimary,
        height: 1.5,
      ),
      bodyMedium: baseText.bodyMedium?.copyWith(
        color: SasColors.textSecondary,
        height: 1.5,
      ),
      bodySmall: baseText.bodySmall?.copyWith(
        color: SasColors.textMuted,
        height: 1.4,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: SasColors.bgSecondary,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: SasColors.textPrimary,
        letterSpacing: -0.01,
      ),
      iconTheme: const IconThemeData(color: SasColors.textPrimary),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: SasColors.bgSecondary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: SasColors.glassBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: SasColors.glassBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: SasColors.accentEmerald,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: SasColors.danger,
          width: 1.0,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: SasColors.danger,
          width: 1.5,
        ),
      ),
      hintStyle: const TextStyle(color: SasColors.textMuted, fontSize: 14),
      labelStyle: const TextStyle(color: SasColors.textSecondary, fontSize: 14),
    ),
    cardTheme: CardThemeData(
      color: SasColors.bgSecondary,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: SasColors.glassBorder),
      ),
    ),
    dividerColor: SasColors.glassBorder,
    useMaterial3: true,
  );
}
