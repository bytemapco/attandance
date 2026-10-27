import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Apple Human Interface Guidelines and Google Material 3 typography system
/// strictly using Plus Jakarta Sans with crisp, confident weights.
class SasTypography {
  SasTypography._();

  static double trackingFor(double fontSize) {
    if (fontSize >= 20) return -0.02 * fontSize;
    if (fontSize <= 12) return 0.01 * fontSize;
    return -0.008 * fontSize;
  }

  static TextStyle style({
    required double fontSize,
    FontWeight fontWeight = FontWeight.w600,
    Color? color,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.plusJakartaSans(
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
  final primaryColor = isDark ? SasColors.brilliance : const Color(0xFF0F172A);
  final secondaryColor =
      isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155);
  final mutedColor =
      isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);

  return TextTheme(
    displayLarge: SasTypography.style(
      fontSize: 32,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.20,
    ),
    displayMedium: SasTypography.style(
      fontSize: 26,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.22,
    ),
    displaySmall: SasTypography.style(
      fontSize: 22,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.25,
    ),
    headlineLarge: SasTypography.style(
      fontSize: 20,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.25,
    ),
    headlineMedium: SasTypography.style(
      fontSize: 17,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.29,
    ),
    headlineSmall: SasTypography.style(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.30,
    ),
    titleLarge: SasTypography.style(
      fontSize: 17,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.29,
    ),
    titleMedium: SasTypography.style(
      fontSize: 15,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.33,
    ),
    titleSmall: SasTypography.style(
      fontSize: 13,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.35,
    ),
    bodyLarge: SasTypography.style(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: primaryColor,
      height: 1.38,
    ),
    bodyMedium: SasTypography.style(
      fontSize: 14.5,
      fontWeight: FontWeight.w500,
      color: secondaryColor,
      height: 1.35,
    ),
    bodySmall: SasTypography.style(
      fontSize: 13,
      fontWeight: FontWeight.w500,
      color: mutedColor,
      height: 1.36,
    ),
    labelLarge: SasTypography.style(
      fontSize: 15,
      fontWeight: FontWeight.w700,
      color: primaryColor,
      height: 1.20,
    ),
    labelMedium: SasTypography.style(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: secondaryColor,
      height: 1.22,
    ),
    labelSmall: SasTypography.style(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      color: mutedColor,
      height: 1.20,
    ),
  );
}
