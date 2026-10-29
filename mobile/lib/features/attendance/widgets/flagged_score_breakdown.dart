import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

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
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
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
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: isPass
                      ? const Color(0xFFECFDF5)
                      : (isDark
                            ? const Color(0xFF3B1E24)
                            : const Color(0xFFFFEEEE)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$overallPct% · ${isPass ? "Passed" : "Needs review"}',
                  style: GoogleFonts.plusJakartaSans(
                    color: isPass
                        ? const Color(0xFF08A875)
                        : const Color(0xFFF0445E),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
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
                  ? const Color(0xFF334155)
                  : const Color(0xFFE9EEF5),
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
                  score: item.faceScore ?? 0.0,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildTile(
                  icon: Icons.shield_outlined,
                  label: 'Liveness',
                  score: item.livenessScore ?? 0.0,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildTile(
                  icon: Icons.location_on_rounded,
                  label: 'Location',
                  score: item.backgroundScore ?? 0.0,
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
    required double score,
    required bool isDark,
  }) {
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
              fontSize: 16.5,
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
