import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_quality_bar.dart';

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
    final borderCol = isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE3E9F1);
    final primaryTextColor = isDark ? SasColors.brilliance : const Color(0xFF0F172A);

    return Column(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: borderCol),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (imagePath != null)
                    Image.file(File(imagePath!), fit: BoxFit.cover),
                  Center(
                    child: Container(
                      width: 210,
                      height: 280,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(105),
                        border: Border.all(
                          color: const Color(0xFFF95721),
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
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: (isDark ? const Color(0xFF0F172A) : Colors.white).withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: borderCol),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          'Review Captured Photo',
                          style: GoogleFonts.plusJakartaSans(
                            color: primaryTextColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
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
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: borderCol),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Photo Quality',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: primaryTextColor,
                ),
              ),
              const SizedBox(height: 12),
              if (isAnalyzingQuality)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(8.0),
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.2, color: Color(0xFFF95721)),
                    ),
                  ),
                )
              else ...[
                if (brightnessScore != null)
                  VerificationQualityBar(
                    label: 'Lighting',
                    value: brightnessScore!,
                    goodThreshold: kMinBrightnessForPhoto,
                  ),
                if (blurScore != null) ...[
                  const SizedBox(height: 10),
                  VerificationQualityBar(
                    label: 'Clarity',
                    value: ((blurScore ?? 0) / 10).clamp(0.0, 1.0),
                    goodThreshold: kMinSharpnessForPhoto,
                  ),
                ],
                if (isPoorQuality) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.15 : 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.25),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.wb_incandescent_outlined, size: 16, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Low lighting detected. Retake in brighter light for faster verification.',
                            style: GoogleFonts.plusJakartaSans(
                              color: isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ],
    );
  }
}
