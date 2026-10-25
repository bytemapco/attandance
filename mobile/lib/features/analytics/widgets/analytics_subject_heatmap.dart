import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/core/extensions.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/legend_dot.dart';

class AnalyticsSubjectHeatmap extends StatelessWidget {
  final AttendanceHistoryResponse data;
  const AnalyticsSubjectHeatmap({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final subjectMap = <String, _HeatmapStat>{};
    for (final item in data.history) {
      final stat = subjectMap.putIfAbsent(
        item.classId,
        () => _HeatmapStat(subject: item.subject, className: item.className),
      );
      stat.items.add(item);
    }

    if (subjectMap.isEmpty) return const SizedBox.shrink();

    final now = DateTime.now();
    final weekLabels = <String>[];
    for (int w = 3; w >= 0; w--) {
      final weekStart = now.subtract(Duration(days: now.weekday - 1 + w * 7));
      weekLabels.add(DateFormat('MMM d').format(weekStart));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Course Activity Heatmap',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Row(
                children: [
                  const SizedBox(width: 90),
                  ...weekLabels.map((l) => Expanded(
                        child: Center(
                          child: Text(
                            l,
                            style: const TextStyle(
                              color: SasColors.textMuted,
                              fontSize: 9,
                            ),
                          ),
                        ),
                      )),
                ],
              ),
              const SizedBox(height: 6),
              ...subjectMap.values.map((stat) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 90,
                        child: Text(
                          stat.subject.truncate(11),
                          style: const TextStyle(
                            color: SasColors.textPrimary,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      ...List.generate(4, (w) {
                        final weekStart = now.subtract(
                            Duration(days: now.weekday - 1 + (3 - w) * 7));
                        final weekEnd =
                            weekStart.add(const Duration(days: 6));
                        final weekItems = stat.items.where((h) {
                          return h.markedAt.isAfter(weekStart
                                  .subtract(const Duration(days: 1))) &&
                              h.markedAt.isBefore(
                                  weekEnd.add(const Duration(days: 1)));
                        }).toList();

                        final wTotal = weekItems.length;
                        final wPresent = countPresentOrApproved(weekItems);
                        final wPct =
                            wTotal > 0 ? wPresent / wTotal : -1.0;

                        Color cellColor = SasColors.bgSurface;
                        if (wPct >= 0.75) {
                          cellColor = SasColors.success.withValues(alpha: 0.2);
                        } else if (wPct >= 0.5) {
                          cellColor = SasColors.warning.withValues(alpha: 0.2);
                        } else if (wPct >= 0.0) {
                          cellColor = SasColors.danger.withValues(alpha: 0.2);
                        }

                        return Expanded(
                          child: Container(
                            height: 22,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              color: cellColor,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: SasColors.glassBorder,
                                width: 0.5,
                              ),
                            ),
                            child: wPct >= 0
                                ? Center(
                                    child: Text(
                                      '${(wPct * 100).toStringAsFixed(0)}%',
                                      style: const TextStyle(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w600,
                                        color: SasColors.textSecondary,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                        );
                      }),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  LegendDot(
                    color: SasColors.success.withValues(alpha: 0.3),
                    label: '≥75%',
                    isCircle: false,
                  ),
                  const SizedBox(width: 8),
                  LegendDot(
                    color: SasColors.warning.withValues(alpha: 0.3),
                    label: '50-74%',
                    isCircle: false,
                  ),
                  const SizedBox(width: 8),
                  LegendDot(
                    color: SasColors.danger.withValues(alpha: 0.3),
                    label: '<50%',
                    isCircle: false,
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

class _HeatmapStat {
  final String subject;
  final String className;
  final List<AttendanceHistoryItem> items = [];
  _HeatmapStat({required this.subject, required this.className});
}
