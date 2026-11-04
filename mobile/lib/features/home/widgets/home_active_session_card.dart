import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/home/widgets/home_session_action_buttons.dart';
import 'package:smart_attendance_app/features/home/widgets/home_session_header_row.dart';

/// Class session card with active verification options matching goal design.
class HomeActiveSessionCard extends StatelessWidget {
  final String courseCode, courseTitle, teacherName, timeText;
  final bool isSessionOn;
  final VoidCallback onTap, onViewAll, onSmartPass, onFaceMatch;

  const HomeActiveSessionCard({
    super.key,
    required this.courseCode,
    required this.courseTitle,
    required this.teacherName,
    required this.timeText,
    required this.isSessionOn,
    required this.onTap,
    required this.onViewAll,
    required this.onSmartPass,
    required this.onFaceMatch,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.darkBorder : SasColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Course Code Pill on Left, LIVE Badge on Right
          HomeSessionHeaderRow(
            courseCode: courseCode,
            isSessionOn: isSessionOn,
          ),
          const SizedBox(height: 12),

          // Course Title
          Text(
            courseTitle,
            style: SasTypography.style(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: primaryTextColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),

          // Teacher & Time Row
          Row(
            children: [
              Icon(Icons.person_rounded, size: 17, color: subtitleColor),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  teacherName,
                  style: SasTypography.style(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: subtitleColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const Icon(
                Icons.access_time_rounded,
                size: 15,
                color: SasColors.copper,
              ),
              const SizedBox(width: 4),
              Text(
                timeText,
                style: SasTypography.style(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: SasColors.copper,
                ),
              ),
            ],
          ),

          // Attendance Verification Options when active
          if (isSessionOn) ...[
            const SizedBox(height: 14),
            HomeSessionActionButtons(
              onSmartPass: onSmartPass,
              onFaceMatch: onFaceMatch,
            ),
          ],
          const SizedBox(height: 12),

          // View All Classes Button
          InkWell(
            onTap: onViewAll,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: isDark
                    ? SasColors.darkSurface
                    : SasColors.ivory,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'View All Classes',
                    style: SasTypography.style(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: primaryTextColor,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 16,
                    color: primaryTextColor,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
