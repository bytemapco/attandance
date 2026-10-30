import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_course_info_row.dart';

/// Card showing course progress, quota targets, and sessions attended.
class AnalyticsCourseProgressCard extends StatelessWidget {
  final AttendanceHistoryResponse data;
  final double target;

  const AnalyticsCourseProgressCard({
    super.key,
    required this.data,
    required this.target,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    final history = data.history;
    final total = history.isEmpty ? 5 : history.length;
    final present = history.isEmpty ? 1 : countPresentOrApproved(history);
    final pct = total > 0 ? (present / total * 100) : 20.0;

    final firstItem = history.isNotEmpty ? history.first : null;
    final courseName = firstItem?.subject ?? 'Distributed Systems';
    final classCode = firstItem != null && firstItem.className.contains(':')
        ? firstItem.className.split(':').first.trim()
        : 'CS-6A';

    final needs = computeAttendanceNeeds(
      present: present,
      total: total,
      target: target,
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Icon(
                Icons.menu_book_rounded,
                color: Color(0xFFF95721),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Course progress',
                style: SasTypography.style(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: primaryTextColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Course Info Row
          AnalyticsCourseInfoRow(
            classCode: classCode,
            courseName: courseName,
            pct: pct,
            present: present,
            total: total,
            isDark: isDark,
            primaryTextColor: primaryTextColor,
            subtitleColor: subtitleColor,
          ),
          const SizedBox(height: 12),

          // Progress Bar
          Container(
            height: 9,
            width: double.infinity,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(6),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: (pct / 100.0).clamp(0.02, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF95721), Color(0xFFFF7A18)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Quota Targets Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                needs.needToAttend > 0
                    ? 'Need ${needs.needToAttend} more for ${target.toStringAsFixed(0)}%'
                    : 'Target met ✓',
                style: SasTypography.style(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: needs.needToAttend > 0
                      ? const Color(0xFFEA580C)
                      : const Color(0xFF16A34A),
                ),
              ),
              Text(
                'Target ${target.toStringAsFixed(0)}%',
                style: SasTypography.style(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w500,
                  color: subtitleColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
