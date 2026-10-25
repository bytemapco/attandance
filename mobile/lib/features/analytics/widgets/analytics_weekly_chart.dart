import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/legend_dot.dart';

class AnalyticsWeeklyChart extends StatelessWidget {
  final AttendanceHistoryResponse data;
  const AnalyticsWeeklyChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final weeks = <String>[];
    final presentCounts = <double>[];
    final totalCounts = <double>[];

    for (int w = 3; w >= 0; w--) {
      final weekStart = now.subtract(Duration(days: now.weekday - 1 + w * 7));
      final weekEnd = weekStart.add(const Duration(days: 6));
      final label = DateFormat('MMM d').format(weekStart);
      weeks.add(label);

      final weekItems = data.history.where((h) {
        return h.markedAt.isAfter(weekStart.subtract(const Duration(days: 1))) &&
            h.markedAt.isBefore(weekEnd.add(const Duration(days: 1)));
      }).toList();

      presentCounts.add(countPresentOrApproved(weekItems).toDouble());
      totalCounts.add(weekItems.length.toDouble());
    }

    final maxY = totalCounts.fold(0.0, (a, b) => a > b ? a : b);
    final chartMax = maxY < 5 ? 5.0 : maxY + 1;

    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Weekly Performance (Last 4 Weeks)',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: SasColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              LegendDot(
                color: SasColors.accentEmerald,
                label: 'Present',
                isCircle: false,
              ),
              const SizedBox(width: 12),
              LegendDot(
                color: const Color(0xFFCBD5E1),
                label: 'Scheduled',
                isCircle: false,
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 150,
            child: BarChart(
              BarChartData(
                maxY: chartMax,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => SasColors.bgSecondary,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final label = rodIndex == 0 ? 'Present' : 'Total';
                      return BarTooltipItem(
                        '$label: ${rod.toY.toInt()}',
                        const TextStyle(
                          color: SasColors.textPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= weeks.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            weeks[idx],
                            style: const TextStyle(
                              color: SasColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 24,
                      getTitlesWidget: (value, meta) {
                        if (value % 2 != 0) return const SizedBox.shrink();
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(
                            color: SasColors.textMuted,
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => const FlLine(
                    color: SasColors.glassBorder,
                    strokeWidth: 1,
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(4, (i) {
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: presentCounts[i],
                        color: SasColors.accentEmerald,
                        width: 12,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      BarChartRodData(
                        toY: totalCounts[i],
                        color: const Color(0xFFCBD5E1),
                        width: 12,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ],
                    barsSpace: 4,
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
