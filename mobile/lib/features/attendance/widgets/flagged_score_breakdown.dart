import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/app/theme.dart';

class FlaggedScoreBreakdown extends StatelessWidget {
  final AttendanceHistoryItem item;

  const FlaggedScoreBreakdown({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    if (item.finalAiScore == null) return const SizedBox.shrink();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final overall = item.finalAiScore ?? 0.0;
    final overallCol = scoreColor(overall);
    final overallPct = (overall * 100).round();
    final isPass = overall >= 0.7;

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
                  fontSize: 15.5,
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
              value: overall.clamp(0.0, 1.0),
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
                child: _buildTile(
                  icon: Icons.face_retouching_natural_rounded,
                  label: 'Face Match',
                  score: item.faceScore,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildTile(
                  icon: Icons.shield_outlined,
                  label: 'Liveness',
                  score: item.livenessScore,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildTile(
                  icon: Icons.location_on_rounded,
                  label: 'Location',
                  score: item.backgroundScore,
                  isDark: isDark,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTile({
    required IconData icon,
    required String label,
    required double? score,
    required bool isDark,
  }) {
    final value = score;
    final col = value == null ? SasColors.mutedOnDark : scoreColor(value);
    final text = value == null ? '—' : '${(value * 100).round()}%';

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? SasColors.ink : SasColors.ivory,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.textSecondary : SasColors.ivory,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: col),
          const SizedBox(height: 6),
          Text(
            text,
            style: GoogleFonts.plusJakartaSans(
              color: col,
              fontWeight: FontWeight.w600,
              fontSize: 16.5,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              color: isDark ? SasColors.mutedOnDark : SasColors.textMuted,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
