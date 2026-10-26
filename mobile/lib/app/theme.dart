import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

class SasColors {
  SasColors._();

  // Core 6-Swatch Palette
  static const Color brilliance = Color(0xFFFDFDFD);
  static const Color polishWhite = Color(0xFFE8E8E7);
  static const Color sunsetInItaly = Color(0xFFF1C183);
  static const Color maidenMist = Color(0xFFBAC0BE);
  static const Color osageOrange = Color(0xFFF6A242);
  static const Color indianInk = Color(0xFF3C3D48);

  // Surface Hierarchy
  static const Color darkCanvas = Color(0xFF17181F);
  static const Color darkSurface = Color(0xFF22242D);
  static const Color darkElevated = Color(0xFF3C3D48);

  static const Color lightCanvas = Color(0xFFFDFDFD);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightElevated = Color(0xFFE8E8E7);

  // Functional & Semantic Tokens
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF6A242);
  static const Color danger = Color(0xFFF43F5E);
  static const Color info = Color(0xFFF1C183);

  // Glow & Overlays
  static const Color accentGlow = Color(0x33F6A242);
  static const Color glassBg = Color(0xFFFFFFFF);
  static const Color glassBgHover = Color(0xFFF8FAFC);
  static const Color glassBorder = Color(0x33BAC0BE);
  static const Color glassBorderHover = Color(0x59BAC0BE);

  // Default Palette Mappings (Light Mode by Default)
  static const Color bgPrimary = lightCanvas;
  static const Color bgCanvas = lightCanvas;
  static const Color bgSecondary = lightSurface;
  static const Color bgSurface = lightElevated;

  static const Color textPrimary = indianInk;
  static const Color textSecondary = Color(0xFF595B6A);
  static const Color textMuted = Color(0xFF858997);

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
  static const double xl = 22;

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

ThemeData buildSasTheme({Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;

  final textColor = isDark ? SasColors.brilliance : SasColors.indianInk;
  final mutedColor = isDark ? SasColors.maidenMist : const Color(0xFF595B6A);
  final subtleBorder = isDark ? const Color(0x2EBAC0BE) : const Color(0x33BAC0BE);

  return ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor: isDark ? SasColors.darkCanvas : SasColors.lightCanvas,
    colorScheme: isDark
        ? const ColorScheme.dark(
            primary: SasColors.osageOrange,
            secondary: SasColors.sunsetInItaly,
            surface: SasColors.darkSurface,
            error: SasColors.danger,
            onPrimary: SasColors.darkCanvas,
            onSecondary: SasColors.darkCanvas,
            onSurface: SasColors.brilliance,
            onError: Colors.white,
          )
        : const ColorScheme.light(
            primary: SasColors.osageOrange,
            secondary: SasColors.sunsetInItaly,
            surface: SasColors.lightSurface,
            error: SasColors.danger,
            onPrimary: Colors.white,
            onSecondary: SasColors.indianInk,
            onSurface: SasColors.indianInk,
            onError: Colors.white,
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
        borderSide: const BorderSide(
          color: SasColors.osageOrange,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: SasColors.danger,
          width: 1.0,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: SasColors.danger,
          width: 1.5,
        ),
      ),
      hintStyle: TextStyle(color: mutedColor, fontSize: 14),
      labelStyle: TextStyle(color: mutedColor, fontSize: 14),
    ),
    cardTheme: CardThemeData(
      color: isDark ? SasColors.darkSurface : SasColors.lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: subtleBorder),
      ),
    ),
    dividerColor: subtleBorder,
    useMaterial3: true,
  );
}
