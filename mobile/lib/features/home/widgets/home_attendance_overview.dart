import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/home/widgets/attendance_progress_gauge.dart';
import 'package:smart_attendance_app/features/home/widgets/attendance_stat_tile.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class HomeAttendanceOverview extends StatelessWidget {
  final double overallPct;
  final List<AttendanceHistoryItem> history;
  final int highestStreak;
  final VoidCallback onTapAnalytics;

  const HomeAttendanceOverview({
    super.key,
    required this.overallPct,
    required this.history,
    required this.highestStreak,
    required this.onTapAnalytics,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final weekPresent = computeWeekPresent(history);
    final streak = calculateStreak(history);
    final isCompliant = overallPct >= 75;
    final presentCount = countPresentOrApproved(history);
    final totalCount = history.length;
    final needs = computeAttendanceNeeds(
      present: presentCount,
      total: totalCount,
      target: 75.0,
    );

    final statusColor = isCompliant ? SasColors.success : SasColors.osageOrange;

    String insightText;
    if (!isCompliant) {
      if (needs.needToAttend > 0) {
        insightText =
            'Attend next ${needs.needToAttend} ${needs.needToAttend == 1 ? 'class' : 'classes'} to restore 75% goal.';
      } else {
        insightText = 'Attendance is below institutional 75% requirement.';
      }
    } else {
      if (needs.canMiss > 0) {
        insightText =
            'On track • Buffer of ${needs.canMiss} ${needs.canMiss == 1 ? 'class' : 'classes'} available.';
      } else {
        insightText = 'On track • Meeting institutional 75% requirement.';
      }
    }

    return GlassCard(
      onTap: onTapAnalytics,
      padding: const EdgeInsets.all(16),
      borderColor: isDark
          ? (isCompliant
              ? SasColors.success.withValues(alpha: 0.15)
              : SasColors.osageOrange.withValues(alpha: 0.2))
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: statusColor,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'TERM COMPLIANCE',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.9,
                      color: isDark ? SasColors.maidenMist : SasColors.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: isDark ? 0.16 : 0.10),
                  borderRadius: BorderRadius.circular(7),
                  border: Border.all(
                    color: statusColor.withValues(alpha: 0.28),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isCompliant
                          ? Icons.check_circle_rounded
                          : Icons.warning_amber_rounded,
                      size: 12,
                      color: statusColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isCompliant ? 'Good Standing' : 'Below 75%',
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              AttendanceProgressGauge(
                overallPct: overallPct,
                isCompliant: isCompliant,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  children: [
                    AttendanceStatTile(
                      icon: Icons.local_fire_department_rounded,
                      iconColor: SasColors.osageOrange,
                      title: '$streak Day Streak',
                      subtitle: 'Personal best: $highestStreak days',
                    ),
                    const SizedBox(height: 7),
                    AttendanceStatTile(
                      icon: Icons.calendar_today_rounded,
                      iconColor: SasColors.sunsetInItaly,
                      title: '$weekPresent ${weekPresent == 1 ? "Class" : "Classes"}',
                      subtitle: 'Attended this week',
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: isDark ? 0.10 : 0.07),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: statusColor.withValues(alpha: 0.2),
                width: 0.8,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isCompliant
                      ? Icons.verified_outlined
                      : Icons.trending_up_rounded,
                  size: 14,
                  color: statusColor,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    insightText,
                    style: TextStyle(
                      color: isDark ? SasColors.brilliance : statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.1,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 11,
                  color: statusColor.withValues(alpha: 0.7),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
