import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/app/theme.dart';

class ResultMetricTile extends StatelessWidget {
  final IconData icon;
  final String label;

  /// Null when the check did not run; shown as a dash, never as 0%.
  final double? score;
  final bool isDark;

  const ResultMetricTile({
    super.key,
    required this.icon,
    required this.label,
    required this.score,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
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
              fontSize: 17,
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
