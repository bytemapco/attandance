import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/home_active_session_card.dart';
import 'package:smart_attendance_app/features/home/widgets/home_classes_states.dart';
import 'package:smart_attendance_app/features/home/widgets/home_empty_classes.dart';
import 'package:smart_attendance_app/features/timetable/widgets/timetable_class_card.dart';
import 'package:smart_attendance_app/shared/load_state.dart';

/// Today's timetable. While a class has attendance open, its quick actions sit above the list.
class HomeTodayClassesCard extends StatelessWidget {
  /// Every class the student is enrolled in; the live one drives the quick actions.
  final SessionState classes;
  final LoadState<StudentTimetable> timetable;
  final DateTime clock;
  final VoidCallback onViewAll;
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;
  final ValueChanged<TimetableEntry> onMark;
  final VoidCallback? onRetry;

  const HomeTodayClassesCard({
    super.key,
    required this.classes,
    required this.timetable,
    required this.clock,
    required this.onViewAll,
    required this.onSmartPass,
    required this.onFaceMatch,
    required this.onMark,
    this.onRetry,
  });

  List<TimetableEntry> get _todayEntries =>
      timetable.data?.dayFor(istDay(istNow(clock)))?.entries ?? const [];

  /// Nothing has answered yet: the timetable has not loaded, or the class list is still loading.
  bool get _loading =>
      classes.isLoading ||
      (!timetable.hasData && timetable.errorMessage == null);

  /// The server answered and the student is enrolled in nothing.
  bool get _inNoClass =>
      classes.sessions.isEmpty && classes.errorMessage == null;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? SasColors.ivory : SasColors.ink;
    final subtitleColor = isDark ? SasColors.mutedOnDark : SasColors.textMuted;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                    DateFormat('EEE, MMM d').format(clock),
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
        ..._body(),
      ],
    );
  }

  List<Widget> _body() {
    final entries = _todayEntries;
    if (entries.isEmpty && _loading) return const [HomeClassesLoading()];
    if (entries.isEmpty && timetable.isBlockingError) {
      return [
        HomeClassesError(message: timetable.errorMessage!, onRetry: onRetry),
      ];
    }
    final live = classes.sessions.where((s) => s.isActive).firstOrNull;
    return [
      if (live != null) ...[_liveCard(live), const SizedBox(height: 12)],
      if (entries.isEmpty) HomeEmptyClasses(inAClass: !_inNoClass),
      for (final entry in entries) ...[
        TimetableClassCard(
          entry: entry,
          clock: clock,
          onMark: () => onMark(entry),
        ),
        const SizedBox(height: 10),
      ],
    ];
  }

  Widget _liveCard(ClassSession live) {
    final ends = live.sessionEndTime;
    return HomeActiveSessionCard(
      courseCode: live.className,
      courseTitle: live.subject.isNotEmpty ? live.subject : live.className,
      teacherName: live.teacherName.isNotEmpty
          ? live.teacherName
          : 'Instructor',
      timeText: ends == null ? 'Open now' : DateFormat('h:mm a').format(ends),
      isSessionOn: true,
      onTap: onViewAll,
      onViewAll: onViewAll,
      onSmartPass: onSmartPass,
      onFaceMatch: onFaceMatch,
    );
  }
}
