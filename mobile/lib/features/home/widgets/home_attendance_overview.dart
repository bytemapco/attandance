import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
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
    final weekPresent = computeWeekPresent(history);
    final streak = calculateStreak(history);
    final isCompliant = overallPct >= 75;

    return GlassCard(
      onTap: onTapAnalytics,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Percentage circle gauge
          Column(
            children: [
              SizedBox(
                width: 72,
                height: 72,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 68,
                      height: 68,
                      child: CircularProgressIndicator(
                        value: (overallPct / 100.0).clamp(0.0, 1.0),
                        strokeWidth: 6,
                        backgroundColor: SasColors.glassBorder,
                        color: isCompliant ? SasColors.success : SasColors.warning,
                      ),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${overallPct.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: SasColors.textPrimary,
                          ),
                        ),
                        const Text(
                          'Overall',
                          style: TextStyle(
                            fontSize: 8,
                            color: SasColors.textMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: (isCompliant ? SasColors.success : SasColors.warning)
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  isCompliant ? 'Compliant' : 'Below 75%',
                  style: TextStyle(
                    color: isCompliant ? SasColors.success : SasColors.warning,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          Container(
            height: 76,
            width: 1,
            color: SasColors.glassBorder,
            margin: const EdgeInsets.symmetric(horizontal: 14),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: SasColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(
                        Icons.bolt_rounded,
                        color: SasColors.warning,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$streak Day Streak',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: SasColors.textPrimary,
                            ),
                          ),
                          Text(
                            'Best record: $highestStreak days',
                            style: const TextStyle(
                              color: SasColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: SasColors.info.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(
                        Icons.calendar_today_rounded,
                        color: SasColors.info,
                        size: 14,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$weekPresent Classes',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: SasColors.textPrimary,
                            ),
                          ),
                          const Text(
                            'Attended this week',
                            style: TextStyle(
                              color: SasColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
