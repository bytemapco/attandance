import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_quality_bar.dart';

class VerificationQualityMetricsCard extends StatelessWidget {
  final bool isAnalyzingQuality;
  final double? brightnessScore;
  final double? blurScore;
  final bool isPoorQuality;

  const VerificationQualityMetricsCard({
    super.key,
    required this.isAnalyzingQuality,
    required this.brightnessScore,
    required this.blurScore,
    required this.isPoorQuality,
  });

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

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Photo Quality',
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w600,
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
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    color: SasColors.copper,
                  ),
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: const Color(
                    0xFFF59E0B,
                  ).withValues(alpha: isDark ? 0.15 : 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: SasColors.warning.withValues(alpha: 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.wb_incandescent_outlined,
                      size: 16,
                      color: SasColors.warning,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Low lighting detected. Retake in brighter light for faster verification.',
                        style: GoogleFonts.plusJakartaSans(
                          color: isDark
                              ? SasColors.warning
                              : SasColors.warning,
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
    );
  }
}
