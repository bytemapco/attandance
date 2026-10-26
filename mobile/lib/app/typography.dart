import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Apple Human Interface Guidelines and Google Material 3 typography system.
class SasTypography {
  SasTypography._();

  static double trackingFor(double fontSize) {
    if (fontSize >= 20) return -0.022 * fontSize;
    if (fontSize <= 12) return 0.012 * fontSize;
    return -0.01 * fontSize;
  }

  static TextStyle style({
    required double fontSize,
    FontWeight fontWeight = FontWeight.normal,
    Color? color,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing ?? trackingFor(fontSize),
      height: height ?? 1.28,
    );
  }
}

TextTheme buildSasTextTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final primaryColor = isDark ? SasColors.brilliance : SasColors.indianInk;
  final secondaryColor = isDark ? SasColors.maidenMist : const Color(0xFF595B6A);
  final mutedColor = isDark ? const Color(0x99BAC0BE) : const Color(0xFF858997);

  return TextTheme(
    // Apple Large Title (34pt)
    displayLarge: SasTypography.style(
      fontSize: 34,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.20,
    ),
    // Apple Title 1 (28pt)
    displayMedium: SasTypography.style(
      fontSize: 28,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.22,
    ),
    // Apple Title 2 (22pt)
    displaySmall: SasTypography.style(
      fontSize: 22,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.25,
    ),
    // Apple Title 3 (20pt)
    headlineLarge: SasTypography.style(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.25,
    ),
    // Apple Headline (17pt, Semibold)
    headlineMedium: SasTypography.style(
      fontSize: 17,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.29,
    ),
    // Apple Callout (16pt, Medium)
    headlineSmall: SasTypography.style(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.30,
    ),
    // Top-bar & Sheet Header (17pt, Semibold)
    titleLarge: SasTypography.style(
      fontSize: 17,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.29,
    ),
    // Sub-section Header (15pt, Semibold)
    titleMedium: SasTypography.style(
      fontSize: 15,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.33,
    ),
    // Minor Group Header (13pt, Semibold)
    titleSmall: SasTypography.style(
      fontSize: 13,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.35,
    ),
    // Apple Body (17pt, Regular)
    bodyLarge: SasTypography.style(
      fontSize: 17,
      fontWeight: FontWeight.w400,
      color: primaryColor,
      height: 1.38,
    ),
    // Apple Subhead / Primary Compact (15pt, Regular)
    bodyMedium: SasTypography.style(
      fontSize: 15,
      fontWeight: FontWeight.w400,
      color: secondaryColor,
      height: 1.35,
    ),
    // Apple Footnote (13pt, Regular)
    bodySmall: SasTypography.style(
      fontSize: 13,
      fontWeight: FontWeight.w400,
      color: mutedColor,
      height: 1.36,
    ),
    // Primary Button & Interactive (15pt, Semibold)
    labelLarge: SasTypography.style(
      fontSize: 15,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.20,
    ),
    // Badge & Secondary Action (12pt, Semibold)
    labelMedium: SasTypography.style(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: secondaryColor,
      height: 1.22,
    ),
    // Caption / Navigation Tab (11pt, Semibold - HIG minimum)
    labelSmall: SasTypography.style(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      color: mutedColor,
      height: 1.20,
    ),
  );
}
