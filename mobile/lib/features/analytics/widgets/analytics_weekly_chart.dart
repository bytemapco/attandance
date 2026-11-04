import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_legend_dot.dart';
import 'package:smart_attendance_app/features/analytics/widgets/weekly_chart_data.dart';

/// Weekly attendance bar chart matching the reference design.
class AnalyticsWeeklyChart extends StatelessWidget {
  final AttendanceHistoryResponse data;

  const AnalyticsWeeklyChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    final chartData = WeeklyChartData.fromHistory(data);
    final weeks = chartData.weeks;
    final presentCounts = chartData.presentCounts;
    final scheduledCounts = chartData.scheduledCounts;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              const Icon(
                Icons.bar_chart_rounded,
                color: SasColors.copper,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Weekly attendance',
                  style: SasTypography.style(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: primaryTextColor,
                  ),
                ),
              ),
              AnalyticsLegendDot(
                color: SasColors.success,
                label: 'Present',
              ),
              const SizedBox(width: 12),
              AnalyticsLegendDot(
                color: isDark
                    ? SasColors.textMuted
                    : SasColors.textOnDark,
                label: 'Scheduled',
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Chart
          SizedBox(
            height: 145,
            child: BarChart(
              BarChartData(
                maxY: 6.0,
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      interval: 2,
                      getTitlesWidget: (v, _) => Text(
                        v.toInt().toString(),
                        style: SasTypography.style(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: subtitleColor,
                        ),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (v, _) {
                        final idx = v.toInt();
                        if (idx < 0 || idx >= weeks.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            weeks[idx],
                            style: SasTypography.style(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: subtitleColor,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 2,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color: isDark
                        ? SasColors.darkBorder
                        : SasColors.textOnDark,
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(4, (i) {
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: presentCounts[i],
                        color: SasColors.success,
                        width: 12,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(3),
                        ),
                      ),
                      BarChartRodData(
                        toY: scheduledCounts[i],
                        color: isDark
                            ? SasColors.textMuted
                            : SasColors.textOnDark,
                        width: 14,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(3),
                        ),
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
