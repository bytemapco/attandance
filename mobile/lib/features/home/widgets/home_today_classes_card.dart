import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/home_active_session_card.dart';
import 'package:smart_attendance_app/features/home/widgets/home_empty_classes.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

/// Section showing Today's Classes header and active class card matching reference design.
class HomeTodayClassesCard extends StatelessWidget {
  final List<ClassSession> sessions;
  final VoidCallback onViewAll;
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;
  final VoidCallback? onRetry;
  final bool isLoading;
  final String? errorMessage;

  const HomeTodayClassesCard({
    super.key,
    required this.sessions,
    required this.onViewAll,
    required this.onSmartPass,
    required this.onFaceMatch,
    this.onRetry,
    this.isLoading = false,
    this.errorMessage,
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

    final activeSession =
        sessions.where((s) => s.isActive).firstOrNull ?? sessions.firstOrNull;

    final isSessionOn = activeSession?.isActive ?? false;

    final courseCode = activeSession != null
        ? (activeSession.className.contains(':')
              ? activeSession.className.split(':').first.trim()
              : activeSession.className)
        : 'Class';

    final courseTitle = activeSession != null
        ? (activeSession.className.contains(':')
              ? activeSession.className.split(':').sublist(1).join(':').trim()
              : activeSession.subject.isNotEmpty
              ? activeSession.subject
              : activeSession.className)
        : 'Scheduled Class';

    final teacherName = activeSession?.teacherName.isNotEmpty == true
        ? activeSession!.teacherName
        : 'Instructor';

    final String timeText;
    if (activeSession?.sessionEndTime != null) {
      timeText = DateFormat('h:mm a').format(activeSession!.sessionEndTime!);
    } else {
      timeText = 'Time unavailable';
    }

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
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
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

        // Active Session Card or Empty State
        if (sessions.isEmpty && isLoading)
          const _ClassesLoadingState()
        else if (sessions.isEmpty && errorMessage != null)
          _ClassesErrorState(message: errorMessage!, onRetry: onRetry)
        else if (sessions.isEmpty)
          const HomeEmptyClasses()
        else
          HomeActiveSessionCard(
            courseCode: courseCode,
            courseTitle: courseTitle,
            teacherName: teacherName,
            timeText: timeText,
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

class _ClassesLoadingState extends StatelessWidget {
  const _ClassesLoadingState();

  @override
  Widget build(BuildContext context) {
    return const ShimmerPlaceholder(itemCount: 1, itemHeight: 116);
  }
}

class _ClassesErrorState extends StatelessWidget {
  const _ClassesErrorState({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final textColor = SasColors.textPrimaryOf(context);
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            liveRegion: true,
            child: Text(message, style: TextStyle(color: textColor)),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ],
      ),
    );
  }
}
