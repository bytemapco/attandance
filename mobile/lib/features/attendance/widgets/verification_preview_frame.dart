import 'dart:io';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_quality_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

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
    return Column(
      children: [
        Expanded(
          child: GlassCard(
            padding: EdgeInsets.zero,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (imagePath != null)
                    Image.file(File(imagePath!), fit: BoxFit.cover),
                  Center(
                    child: Container(
                      width: 220,
                      height: 280,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(110),
                        border: Border.all(
                          color: SasColors.accentEmerald.withValues(alpha: 0.6),
                          width: 2,
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
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: SasColors.bgSecondary.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: SasColors.glassBorder),
                        ),
                        child: const Text(
                          'Review your photo',
                          style: TextStyle(
                            color: SasColors.textPrimary,
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
        GlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quality Check (Estimate):',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 12),
              if (isAnalyzingQuality)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(8.0),
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: SasColors.accentEmerald,
                      ),
                    ),
                  ),
                )
              else ...[
                VerificationQualityBar(
                  label: 'Lighting',
                  value: brightnessScore ?? 0,
                  goodThreshold: 0.3,
                ),
                const SizedBox(height: 12),
                VerificationQualityBar(
                  label: 'Sharpness',
                  value: ((blurScore ?? 0) / 10).clamp(0.0, 1.0),
                  goodThreshold: 0.3,
                ),
              ]
            ],
          ),
        ),
        if (isPoorQuality) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: SasColors.warning.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: SasColors.warning.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: SasColors.warning, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Photo too dark or blurry — please retake',
                    style: TextStyle(color: SasColors.warning, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
