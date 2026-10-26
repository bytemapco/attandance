import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/stat_tile.dart';

class AnalyticsKpiOverview extends StatelessWidget {
  final AttendanceHistoryResponse data;
  final double target;

  const AnalyticsKpiOverview({
    super.key,
    required this.data,
    required this.target,
  });

  @override
  Widget build(BuildContext context) {
    final history = data.history;
    final total = history.length;
    final present = countPresentOrApproved(history);
    final absent = countAbsent(history);
    final flagged = countFlagged(history);
    final pct = data.overallAttendancePercentage;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Attendance KPIs',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: StatTile(
                label: 'Total',
                value: '$total',
                color: SasColors.info,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatTile(
                label: 'Present',
                value: '$present',
                color: SasColors.success,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatTile(
                label: 'Absent',
                value: '$absent',
                color: SasColors.danger,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatTile(
                label: 'Flagged',
                value: '$flagged',
                color: SasColors.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        GlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Overall Attendance Rate',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: SasColors.textPrimary,
                    ),
                  ),
                  Text(
                    '${pct.toStringAsFixed(1)}%',
                    style: TextStyle(
                      color: pctColor(pct),
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (pct / 100).clamp(0.0, 1.0),
                  backgroundColor: SasColors.bgSurface,
                  valueColor: AlwaysStoppedAnimation<Color>(pctColor(pct)),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Target: ${target.toStringAsFixed(0)}%',
                    style: const TextStyle(
                      color: SasColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                  if (pct < target)
                    Text(
                      'Deficit: ${(target - pct).toStringAsFixed(1)}%',
                      style: const TextStyle(
                        color: SasColors.warning,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  else
                    const Text(
                      'Target met ✓',
                      style: TextStyle(
                        color: SasColors.success,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
