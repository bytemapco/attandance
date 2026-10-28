import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/home_active_session_card.dart';

/// Section showing Today's Classes header and active class card matching reference design.
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
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header Row: Today's Classes on Left, Calendar + Date on Right
        Padding(
          padding: const EdgeInsets.only(left: 2, right: 2, bottom: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Today's Classes",
                style: SasTypography.style(
                  fontSize: 18.5,
                  fontWeight: FontWeight.w800,
                  color: primaryTextColor,
                  letterSpacing: -0.4,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.calendar_today_rounded,
                    size: 15,
                    color: subtitleColor,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    formattedDate,
                    style: SasTypography.style(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: subtitleColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Active Session Card
        HomeActiveSessionCard(
          courseCode: courseCode,
          courseTitle: courseTitle,
          teacherName: teacherName,
          timeText: '9:56',
          isSessionOn: isSessionOn,
          onTap: onViewAll,
          onViewAll: onViewAll,
          onSmartPass: onSmartPass,
          onFaceMatch: onFaceMatch,
        ),
      ],
    );
  }
}
