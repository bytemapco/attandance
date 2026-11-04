import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

export 'package:smart_attendance_app/app/dimensions.dart';

class SasColors {
  SasColors._();

  // Brand palette: docs/sahaj_brand_kit.md (Carbon & Copper)
  static const Color carbon = Color(0xFF28363B);
  static const Color copper = Color(0xFFC98260);
  static const Color copperStrong = Color(0xFF8A4D30); // copper as text on light surfaces
  static const Color brilliance = Color(0xFFF5F2ED); // warm ivory
  static const Color polishWhite = Color(0xFFEEECE7);
  static const Color sunsetInItaly = Color(0xFFF7EFEA); // soft copper tint
  static const Color maidenMist = Color(0xFF9DB0B6); // muted text on dark
  static const Color osageOrange = copper;
  static const Color indianInk = Color(0xFF202B30);

  // Surface hierarchy: dark (carbon)
  static const Color darkCanvas = Color(0xFF1A2327);
  static const Color darkSurface = Color(0xFF232F34);
  static const Color darkElevated = Color(0xFF2E3C42);

  // Surface hierarchy: light (warm ivory)
  static const Color lightCanvas = Color(0xFFF5F2ED);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightElevated = Color(0xFFEEECE7);

  // Semantic
  static const Color success = Color(0xFF247653);
  static const Color warning = Color(0xFF8A5B12);
  static const Color danger = Color(0xFFB54242);
  static const Color info = Color(0xFF306B8A);

  // Borders and surfaces
  static const Color glassBg = Color(0xFFFFFFFF);
  static const Color glassBgHover = Color(0xFFEEECE7);
  static const Color glassBorder = Color(0xFFE3E1DC);
  static const Color glassBorderHover = Color(0xFFD4D0C8);

  // Default Palette Mappings (Light Mode)
  static const Color bgPrimary = lightCanvas;
  static const Color bgCanvas = lightCanvas;
  static const Color bgSecondary = lightSurface;
  static const Color bgSurface = lightElevated;

  static const Color textPrimary = brilliance;
  static const Color textSecondary = Color(0xFF3D4A4F);
  static const Color textMuted = Color(0xFF526F78);

  static Color textPrimaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? brilliance
      : indianInk;

  static Color textSecondaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? const Color(0xFFD5DEE1)
      : textSecondary;

  static Color textMutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? maidenMist
      : textMuted;

  static const Color accentEmerald = success;
  static const Color accentAmber = osageOrange;
}

ThemeData buildSasTheme({Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;

  final textColor = isDark ? SasColors.brilliance : SasColors.indianInk;
  final mutedColor = isDark ? SasColors.maidenMist : SasColors.textSecondary;
  final subtleBorder = isDark
      ? const Color(0x1EFFFFFF)
      : SasColors.glassBorder;

  return ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor: isDark
        ? SasColors.darkCanvas
        : SasColors.lightCanvas,
    colorScheme: isDark
        ? ColorScheme.dark(
            primary: SasColors.brilliance,
            secondary: SasColors.copper,
            surface: SasColors.darkSurface,
            error: SasColors.danger,
            onPrimary: SasColors.indianInk,
            onSecondary: SasColors.darkCanvas,
            onSurface: SasColors.brilliance,
            onError: Colors.white,
            outline: subtleBorder,
          )
        : ColorScheme.light(
            primary: SasColors.carbon,
            secondary: SasColors.copper,
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
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: subtleBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: subtleBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: SasColors.carbon, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: SasColors.danger, width: 1.0),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: SasColors.danger, width: 1.5),
      ),
      hintStyle: TextStyle(color: mutedColor, fontSize: 14),
      labelStyle: TextStyle(color: mutedColor, fontSize: 14),
    ),
    cardTheme: CardThemeData(
      color: isDark ? SasColors.darkSurface : SasColors.lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: subtleBorder),
      ),
    ),
    dividerColor: subtleBorder,
    useMaterial3: true,
  );
}
