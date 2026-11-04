import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_quality_metrics_card.dart';

class VerificationPreviewFrame extends StatelessWidget {
  final String? imagePath;
  final bool isAnalyzingQuality;
  final double? brightnessScore;
  final double? blurScore;

  const VerificationPreviewFrame({
    super.key,
    required this.imagePath,
    required this.isAnalyzingQuality,
    required this.brightnessScore,
    required this.blurScore,
  });

  bool get isPoorQuality =>
      brightnessScore != null &&
      (brightnessScore! < kMinBrightnessForPhoto ||
          ((blurScore ?? 0) / 10).clamp(0.0, 1.0) < kMinSharpnessForPhoto);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? SasColors.darkBorder
        : SasColors.border;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;

    return Column(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderCol),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (imagePath != null)
                    Image.file(
                      File(imagePath!),
                      fit: BoxFit.cover,
                      semanticLabel: 'Selfie preview',
                    ),
                  Center(
                    child: Container(
                      width: 210,
                      height: 280,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(105),
                        border: Border.all(
                          color: SasColors.copper,
                          width: 2.2,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 16,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color:
                              (isDark ? SasColors.ink : Colors.white)
                                  .withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderCol),
                        ),
                        child: Text(
                          'Review Captured Photo',
                          style: GoogleFonts.plusJakartaSans(
                            color: primaryTextColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        VerificationQualityMetricsCard(
          isAnalyzingQuality: isAnalyzingQuality,
          brightnessScore: brightnessScore,
          blurScore: blurScore,
          isPoorQuality: isPoorQuality,
        ),
      ],
    );
  }
}
