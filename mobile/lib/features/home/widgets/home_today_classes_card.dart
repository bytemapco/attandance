import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/home_active_session_card.dart';

/// Card showing Today's Classes preview with active session tile and View All button.
class HomeTodayClassesCard extends StatelessWidget {
  final List<ClassSession> sessions;
  final VoidCallback onViewAll;
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;

  const HomeTodayClassesCard({
    super.key,
    required this.sessions,
    required this.onViewAll,
    required this.onSmartPass,
    required this.onFaceMatch,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155);

    final activeSession = sessions.where((s) => s.isActive).firstOrNull ??
        sessions.firstOrNull;

    final isSessionOn = activeSession != null ? activeSession.isActive : true;

    final courseCode =
        activeSession != null && activeSession.className.contains(':')
            ? activeSession.className.split(':').first.trim()
            : 'CS-6A';

    final courseTitle = activeSession != null
        ? (activeSession.className.contains(':')
            ? activeSession.className.split(':').sublist(1).join(':').trim()
            : activeSession.subject.isNotEmpty
                ? activeSession.subject
                : activeSession.className)
        : 'Distributed Systems';

    final teacherName = activeSession?.teacherName.isNotEmpty == true
        ? activeSession!.teacherName
        : 'Robert Hayes';

    final formattedDate = DateFormat('EEE, MMM d').format(DateTime.now());

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0x0F000000),
          width: 1.0,
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
        children: [
          // Header Row: Today's Classes & Current Date
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEDD5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.layers_rounded,
                  color: Color(0xFFEA580C),
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "Today's Classes",
                style: SasTypography.style(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: primaryTextColor,
                  letterSpacing: -0.3,
                ),
              ),
              const Spacer(),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    formattedDate,
                    style: SasTypography.style(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: subtitleColor,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.calendar_today_rounded,
                    size: 14,
                    color: subtitleColor,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Active session card matching screenshot
          HomeActiveSessionCard(
            courseCode: courseCode,
            courseTitle: courseTitle,
            teacherName: teacherName,
            timeText: '9:56',
            isSessionOn: isSessionOn,
            onTap: onViewAll,
            onSmartPass: onSmartPass,
            onFaceMatch: onFaceMatch,
          ),
          const SizedBox(height: 14),

          // View All Classes Button
          InkWell(
            onTap: onViewAll,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E2838) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'View All Classes',
                    style: SasTypography.style(
                      fontSize: 13,
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
