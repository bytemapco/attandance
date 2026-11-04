import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_metric_tile.dart';
import 'package:smart_attendance_app/app/theme.dart';

class ResultMetricsCard extends StatelessWidget {
  final ScoreData scores;

  const ResultMetricsCard({super.key, required this.scores});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final overallCol = scoreColor(scores.overall);
    final overallPct = (scores.overall * 100).round();
    final isPass = scores.overall >= 0.7;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.textSecondary : SasColors.ivory,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Verification score',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : SasColors.ink,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: isPass
                      ? SasColors.successSoft
                      : (isDark
                            ? SasColors.darkDangerSoft
                            : SasColors.dangerSoft),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$overallPct% · ${isPass ? "Passed" : "Needs review"}',
                  style: GoogleFonts.plusJakartaSans(
                    color: isPass
                        ? SasColors.success
                        : SasColors.danger,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: scores.overall.clamp(0.0, 1.0),
              backgroundColor: isDark
                  ? SasColors.textSecondary
                  : SasColors.lightElevated,
              valueColor: AlwaysStoppedAnimation<Color>(overallCol),
              minHeight: 7,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ResultMetricTile(
                  icon: Icons.face_retouching_natural_rounded,
                  label: 'Face Match',
                  score: scores.face,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ResultMetricTile(
                  icon: Icons.shield_outlined,
                  label: 'Liveness',
                  score: scores.liveness,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ResultMetricTile(
                  icon: Icons.location_on_rounded,
                  label: 'Location',
                  score: scores.background,
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? SasColors.info
                      : SasColors.infoSoft,
                ),
                child: Center(
                  child: Icon(
                    Icons.info_outline_rounded,
                    size: 14,
                    color: isDark
                        ? SasColors.info
                        : SasColors.info,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  isPass
                      ? 'Your attendance has been confirmed.'
                      : 'Your instructor will review this attendance record.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? SasColors.mutedOnDark
                        : SasColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
