import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/home/widgets/attendance_progress_gauge.dart';
import 'package:smart_attendance_app/features/home/widgets/attendance_stat_tile.dart';
import 'package:smart_attendance_app/features/home/widgets/home_attendance_status_badge.dart';
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
      insightText = needs.needToAttend > 0
          ? 'Attend next ${needs.needToAttend} ${needs.needToAttend == 1 ? 'class' : 'classes'} to reach 75%.'
          : 'Below the institutional 75% requirement.';
    } else {
      insightText = needs.canMiss > 0
          ? 'On track · ${needs.canMiss} ${needs.canMiss == 1 ? 'class' : 'classes'} buffer available.'
          : 'Meeting institutional 75% requirement.';
    }

    return GlassCard(
      onTap: onTapAnalytics,
      padding: const EdgeInsets.all(18),
      borderColor: isDark
          ? (isCompliant
              ? SasColors.success.withValues(alpha: 0.20)
              : SasColors.osageOrange.withValues(alpha: 0.25))
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: statusColor,
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withValues(alpha: 0.6),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 7),
                  Text(
                    'TERM COMPLIANCE',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                      color: SasColors.textSecondaryOf(context),
                    ),
                  ),
                ],
              ),
              HomeAttendanceStatusBadge(
                isCompliant: isCompliant,
                statusColor: statusColor,
                isDark: isDark,
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Gauge + stats
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              AttendanceProgressGauge(
                overallPct: overallPct,
                isCompliant: isCompliant,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AttendanceStatTile(
                      icon: Icons.local_fire_department_rounded,
                      iconColor: SasColors.osageOrange,
                      title: '$streak Day Streak',
                      subtitle: 'Best: $highestStreak days',
                    ),
                    const SizedBox(height: 10),
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

          const SizedBox(height: 14),

          // Insight banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: isDark ? 0.12 : 0.07),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: statusColor.withValues(alpha: 0.22),
                width: 0.8,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isCompliant
                      ? Icons.verified_outlined
                      : Icons.trending_up_rounded,
                  size: 15,
                  color: statusColor,
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    insightText,
                    style: TextStyle(
                      color: isDark ? SasColors.brilliance : statusColor,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.1,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 11,
                  color: statusColor.withValues(alpha: 0.6),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
