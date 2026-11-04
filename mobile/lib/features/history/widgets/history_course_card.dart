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
    this.courseTitle = 'All Enrolled Subjects',
    this.courseSubtitle = 'Course Overview • Attendance Log',
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? SasColors.darkSurface : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
            width: 1.0,
          ),
        ),
        child: Row(
          children: [
            // Graduation cap peach circle badge
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: SasColors.copperSoft,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.school_rounded,
                  color: SasColors.copperStrong,
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
                      fontWeight: FontWeight.w600,
                      color: primaryTextColor,
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
