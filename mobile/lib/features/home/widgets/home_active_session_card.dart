import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/home/widgets/home_session_action_buttons.dart';

/// Class session card matching exact layout in 3df38c6a-588b-4d97-a21b-7dbb519f25de.png
class HomeActiveSessionCard extends StatelessWidget {
  final String courseCode;
  final String courseTitle;
  final String teacherName;
  final String timeText;
  final bool isSessionOn;
  final VoidCallback onTap;
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;

  const HomeActiveSessionCard({
    super.key,
    required this.courseCode,
    required this.courseTitle,
    required this.teacherName,
    required this.timeText,
    required this.isSessionOn,
    required this.onTap,
    required this.onSmartPass,
    required this.onFaceMatch,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2838) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0x0F000000),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top Row: [ CS-6A ] on Left, [ • LIVE ] on Right
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Course Code Peach Badge
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

                // Live Indicator Badge
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
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF16A34A),
                            letterSpacing: 0.2,
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
                fontWeight: FontWeight.w700,
                color: primaryTextColor,
                letterSpacing: -0.3,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),

            // Instructor and Time Row
            Row(
              children: [
                Icon(
                  Icons.person_rounded,
                  size: 16,
                  color: subtitleColor,
                ),
                const SizedBox(width: 5),
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
                Icon(
                  Icons.access_time_rounded,
                  size: 15,
                  color: const Color(0xFFF97316),
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

            // Action Buttons when session is active/on
            if (isSessionOn) ...[
              const SizedBox(height: 14),
              HomeSessionActionButtons(
                onSmartPass: onSmartPass,
                onFaceMatch: onFaceMatch,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
