import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/home/widgets/home_session_action_buttons.dart';

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
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0x0F000000),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Course Code Pill on Left, LIVE Badge on Right
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEDD5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  courseCode,
                  style: SasTypography.style(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFEA580C),
                  ),
                ),
              ),
              if (isSessionOn)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Color(0xFF16A34A),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        'LIVE',
                        style: SasTypography.style(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF16A34A),
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Course Title
          Text(
            courseTitle,
            style: SasTypography.style(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: primaryTextColor,
              letterSpacing: -0.3,
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
                color: Color(0xFFF97316),
              ),
              const SizedBox(width: 4),
              Text(
                timeText,
                style: SasTypography.style(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFF97316),
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
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1E2838)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'View All Classes',
                    style: SasTypography.style(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
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
