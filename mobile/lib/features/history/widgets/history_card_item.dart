import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Single attendance log card matching the List View in reference screenshot.
class HistoryCardItem extends StatelessWidget {
  final String monthText;
  final String dayText;
  final String courseTitle;
  final String subtitle;
  final String timeText;
  final String status;
  final VoidCallback? onTap;

  const HistoryCardItem({
    super.key,
    required this.monthText,
    required this.dayText,
    required this.courseTitle,
    required this.subtitle,
    required this.timeText,
    required this.status,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final normalizedStatus = _formatStatus(status);
    final isPresent = normalizedStatus == 'Present';
    final isAbsent = normalizedStatus == 'Absent';

    final pillBg = isPresent
        ? const Color(0xFFE8F8F0)
        : (isAbsent ? const Color(0xFFFEE8E8) : const Color(0xFFFEF3C7));
    final pillText = isPresent
        ? const Color(0xFF16A34A)
        : (isAbsent ? const Color(0xFFDC2626) : const Color(0xFFD97706));

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        margin: const EdgeInsets.only(bottom: 11),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Left Date container (OCT 27)
            Container(
              width: 50,
              height: 52,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    monthText.toUpperCase(),
                    style: SasTypography.style(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFF95721),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    dayText,
                    style: SasTypography.style(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: primaryTextColor,
                      height: 1.0,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Course Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    courseTitle,
                    style: SasTypography.style(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: primaryTextColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: SasTypography.style(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: subtitleColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Time and Status pill
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  timeText,
                  style: SasTypography.style(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: subtitleColor,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3.5,
                  ),
                  decoration: BoxDecoration(
                    color: pillBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    normalizedStatus,
                    style: SasTypography.style(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: pillText,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatStatus(String s) {
    final lower = s.toLowerCase();
    if (lower == 'present' || lower == 'approved') return 'Present';
    if (lower == 'absent') return 'Absent';
    if (lower == 'excused' || lower == 'flagged') return 'Excused';
    return s.isNotEmpty ? s[0].toUpperCase() + s.substring(1).toLowerCase() : 'Present';
  }
}
