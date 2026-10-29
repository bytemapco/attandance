import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

class SasColors {
  SasColors._();

  // Core Brand Palette — "Academy Premium"
  static const Color brilliance = Color(0xFFFDFDFD);
  static const Color polishWhite = Color(0xFFEFF3F7);
  static const Color sunsetInItaly = Color(0xFFEAC96A); // champagne
  static const Color maidenMist = Color(
    0xFF94A3B8,
  ); // slate-400 (navy-compatible)
  static const Color osageOrange = Color(0xFFF59E0B); // amber
  static const Color indianInk = Color(
    0xFF1E293B,
  ); // slate-800 (light-mode text)

  // Surface Hierarchy — Dark (deep navy)
  static const Color darkCanvas = Color(0xFF0D1B2A);
  static const Color darkSurface = Color(0xFF162033);
  static const Color darkElevated = Color(0xFF1E3048);

  // Surface Hierarchy — Light (cool-tinted)
  static const Color lightCanvas = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightElevated = Color(0xFFEFF3F7);

  // Semantic
  static const Color success = Color(0xFF10B981); // emerald
  static const Color warning = Color(0xFFF59E0B); // amber
  static const Color danger = Color(0xFFF43F5E); // rose
  static const Color info = Color(0xFF38BDF8); // sky blue

  // Glow & Overlays
  static const Color accentGlow = Color(0x33F59E0B);
  static const Color glassBg = Color(0xFFFFFFFF);
  static const Color glassBgHover = Color(0xFFF8FAFC);
  static const Color glassBorder = Color(0x1EFFFFFF);
  static const Color glassBorderHover = Color(0x33FFFFFF);

  // Default Palette Mappings (Light Mode)
  static const Color bgPrimary = lightCanvas;
  static const Color bgCanvas = lightCanvas;
  static const Color bgSecondary = lightSurface;
  static const Color bgSurface = lightElevated;

  static const Color textPrimary = brilliance;
  static const Color textSecondary = Color(
    0xFF334155,
  ); // slate-700 (deep, sharp contrast)
  static const Color textMuted = Color(
    0xFF475569,
  ); // slate-600 (clear legible contrast)

  static Color textPrimaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? brilliance
      : const Color(0xFF0F172A);

  static Color textSecondaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? const Color(0xFFCBD5E1) // slate-300: bright, crisp against navy
      : const Color(0xFF334155); // slate-700: deep, high-contrast charcoal

  static Color textMutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? const Color(0xFF94A3B8) // slate-400
      : const Color(0xFF475569); // slate-600: 6:1 contrast ratio against white

  static const Color accentEmerald = success;
  static const Color accentTeal = sunsetInItaly;
  static const Color accentPink = danger;
  static const Color accentAmber = osageOrange;
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

  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 28;

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
  static const Duration spring = Duration(milliseconds: 400);
}

ThemeData buildSasTheme({Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;

  final textColor = isDark ? SasColors.brilliance : SasColors.indianInk;
  final mutedColor = isDark ? SasColors.maidenMist : SasColors.textSecondary;
  final subtleBorder = isDark
      ? const Color(0x1EFFFFFF)
      : const Color(0x18000000);

  return ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor: isDark
        ? SasColors.darkCanvas
        : SasColors.lightCanvas,
    colorScheme: isDark
        ? ColorScheme.dark(
            primary: SasColors.osageOrange,
            secondary: SasColors.sunsetInItaly,
            surface: SasColors.darkSurface,
            error: SasColors.danger,
            onPrimary: Colors.white,
            onSecondary: SasColors.darkCanvas,
            onSurface: SasColors.brilliance,
            onError: Colors.white,
            outline: subtleBorder,
          )
        : ColorScheme.light(
            primary: SasColors.osageOrange,
            secondary: SasColors.sunsetInItaly,
            surface: SasColors.lightSurface,
            error: SasColors.danger,
            onPrimary: Colors.white,
            onSecondary: SasColors.indianInk,
            onSurface: SasColors.indianInk,
            onError: Colors.white,
            outline: subtleBorder,
          ),
    textTheme: buildSasTextTheme(brightness),
    appBarTheme: AppBarTheme(
      backgroundColor: isDark ? SasColors.darkSurface : SasColors.lightSurface,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: SasTypography.style(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      iconTheme: IconThemeData(color: textColor),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isDark ? SasColors.darkSurface : SasColors.polishWhite,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: subtleBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: subtleBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: SasColors.osageOrange, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: SasColors.danger, width: 1.0),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: SasColors.danger, width: 1.5),
      ),
      hintStyle: TextStyle(color: mutedColor, fontSize: 14),
      labelStyle: TextStyle(color: mutedColor, fontSize: 14),
    ),
    cardTheme: CardThemeData(
      color: isDark ? SasColors.darkSurface : SasColors.lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: subtleBorder),
      ),
    ),
    dividerColor: subtleBorder,
    useMaterial3: true,
  );
}
