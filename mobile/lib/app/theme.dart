import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

export 'package:smart_attendance_app/app/dimensions.dart';

class SasColors {
  SasColors._();

  // Brand palette: docs/sahaj_brand_kit.md (Carbon & Copper)
  static const Color carbon = Color(0xFF28363B);
  static const Color copper = Color(0xFFC98260);
  static const Color copperStrong = Color(0xFF8A4D30); // copper as text on light surfaces
  static const Color copperSoft = Color(0xFFF7EFEA);
  static const Color copperBorder = Color(0xFFF0DED4);
  static const Color ivory = Color(0xFFF5F2ED);
  static const Color ink = Color(0xFF202B30);
  static const Color mutedOnDark = Color(0xFF9DB0B6);
  static const Color textOnDark = Color(0xFFD5DEE1);

  // Surface hierarchy: dark (carbon)
  static const Color darkCanvas = Color(0xFF1A2327);
  static const Color darkSurface = Color(0xFF232F34);
  static const Color darkElevated = Color(0xFF2E3C42);
  static const Color darkBorder = Color(0x1EFFFFFF);
  static const Color darkBorderStrong = Color(0x33FFFFFF);

  // Surface hierarchy: light (warm ivory)
  static const Color lightCanvas = Color(0xFFF5F2ED);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightElevated = Color(0xFFEEECE7);
  static const Color border = Color(0xFFE3E1DC);
  static const Color borderStrong = Color(0xFFD4D0C8);

  // Semantic: text color, soft fill, border, and the soft fill on dark surfaces
  static const Color success = Color(0xFF247653);
  static const Color successSoft = Color(0xFFE8F3ED);
  static const Color successBorder = Color(0xFFC6E2D3);
  static const Color darkSuccessSoft = Color(0xFF1E3A2F);
  static const Color warning = Color(0xFF8A5B12);
  static const Color warningSoft = Color(0xFFFBF1DF);
  static const Color warningBorder = Color(0xFFF2DEBA);
  static const Color darkWarningSoft = Color(0xFF3A2F18);
  static const Color danger = Color(0xFFB54242);
  static const Color dangerSoft = Color(0xFFF9EAEA);
  static const Color dangerBorder = Color(0xFFF0C9C9);
  static const Color darkDangerSoft = Color(0xFF3F2427);
  static const Color info = Color(0xFF306B8A);
  static const Color infoSoft = Color(0xFFEAF2F6);
  static const Color infoBorder = Color(0xFFC5DCE8);
  static const Color darkInfoSoft = Color(0xFF1E3342);

  // Default Palette Mappings (Light Mode)
  static const Color bgPrimary = lightCanvas;
  static const Color bgCanvas = lightCanvas;
  static const Color bgSecondary = lightSurface;
  static const Color bgSurface = lightElevated;

  static const Color textPrimary = ivory;
  static const Color textSecondary = Color(0xFF3D4A4F);
  static const Color textMuted = Color(0xFF526F78);

  static Color textPrimaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? ivory
      : ink;

  static Color textSecondaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? textOnDark
      : textSecondary;

  static Color textMutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? mutedOnDark
      : textMuted;
}

ThemeData buildSasTheme({Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;

  final textColor = isDark ? SasColors.ivory : SasColors.ink;
  final mutedColor = isDark ? SasColors.mutedOnDark : SasColors.textSecondary;
  final subtleBorder = isDark
      ? const Color(0x1EFFFFFF)
      : SasColors.border;

  return ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor: isDark
        ? SasColors.darkCanvas
        : SasColors.lightCanvas,
    colorScheme: isDark
        ? ColorScheme.dark(
            primary: SasColors.ivory,
            secondary: SasColors.copper,
            surface: SasColors.darkSurface,
            error: SasColors.danger,
            onPrimary: SasColors.ink,
            onSecondary: SasColors.darkCanvas,
            onSurface: SasColors.ivory,
            onError: Colors.white,
            outline: subtleBorder,
          )
        : ColorScheme.light(
            primary: SasColors.carbon,
            secondary: SasColors.copper,
            surface: SasColors.lightSurface,
            error: SasColors.danger,
            onPrimary: Colors.white,
            onSecondary: SasColors.ink,
            onSurface: SasColors.ink,
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
      fillColor: isDark ? SasColors.darkSurface : SasColors.lightElevated,
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
