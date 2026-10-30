import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';

class ResultMetricTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final double score;
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
    final col = scoreColor(score);
    final pct = (score * 100).round();

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: col),
          const SizedBox(height: 6),
          Text(
            '$pct%',
            style: GoogleFonts.plusJakartaSans(
              color: col,
              fontWeight: FontWeight.w800,
              fontSize: 17,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
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
