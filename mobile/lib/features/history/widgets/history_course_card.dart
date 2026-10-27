import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Course dropdown card showing selected course and teacher from reference design.
class HistoryCourseCard extends StatelessWidget {
  final String courseTitle;
  final String courseSubtitle;
  final VoidCallback? onTap;

  const HistoryCourseCard({
    super.key,
    this.courseTitle = 'Distributed Systems',
    this.courseSubtitle = 'CS-6A • Robert Hayes',
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2838) : Colors.white,
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
            // Graduation cap peach circle badge
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFFFFEDD5),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.school_rounded,
                  color: Color(0xFFEA580C),
                  size: 22,
                ),
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
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: primaryTextColor,
                      letterSpacing: -0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    courseSubtitle,
                    style: SasTypography.style(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w500,
                      color: subtitleColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Dropdown Chevron
            Icon(
              Icons.keyboard_arrow_down_rounded,
              color: subtitleColor,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
