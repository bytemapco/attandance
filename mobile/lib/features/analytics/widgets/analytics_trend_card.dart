import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';

/// Attendance per week for the last eight weeks, with the institution's minimum drawn as a line.
/// A week with no classes has no bar.
class AnalyticsTrendCard extends StatelessWidget {
  final List<WeekFigures> weeks;
  final double threshold;

  const AnalyticsTrendCard({
    super.key,
    required this.weeks,
    required this.threshold,
  });

  @override
  Widget build(BuildContext context) {
    final muted = SasColors.textMutedOf(context);
    final hasData = weeks.any((w) => w.percentage != null);
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly attendance',
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text('Last 8 weeks', style: TextStyle(color: muted, fontSize: 12)),
          const SizedBox(height: 16),
          if (!hasData)
            SizedBox(
              height: 120,
              child: Center(
                child: Text(
                  'No classes in the last 8 weeks.',
                  style: TextStyle(color: muted, fontSize: 13),
                ),
              ),
            )
          else
            Semantics(
              label: _description(),
              excludeSemantics: true,
              child: SizedBox(height: 160, child: _chart(context)),
            ),
        ],
      ),
    );
  }

  String _description() => weeks
      .where((w) => w.percentage != null)
      .map(
        (w) =>
            'Week of ${DateFormat('d MMMM').format(w.weekStart)}: ${percentLabel(w.percentage)}',
      )
      .join('. ');

  Widget _chart(BuildContext context) {
    final muted = SasColors.textMutedOf(context);
    return BarChart(
      BarChartData(
        minY: 0,
        maxY: 100,
        alignment: BarChartAlignment.spaceAround,
        barTouchData: BarTouchData(enabled: false),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              interval: 25,
              getTitlesWidget: (value, _) => Text(
                '${value.toInt()}',
                style: TextStyle(color: muted, fontSize: 11),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 22,
              getTitlesWidget: (value, _) {
                final index = value.toInt();
                if (index < 0 || index >= weeks.length) return const SizedBox();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    DateFormat('d/M').format(weeks[index].weekStart),
                    style: TextStyle(color: muted, fontSize: 11),
                  ),
                );
              },
            ),
          ),
        ),
        extraLinesData: ExtraLinesData(
          horizontalLines: [
            HorizontalLine(
              y: threshold,
              color: SasColors.textPrimaryOf(context).withValues(alpha: 0.4),
              strokeWidth: 1,
              dashArray: [4, 4],
            ),
          ],
        ),
        barGroups: [
          for (var i = 0; i < weeks.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: weeks[i].percentage ?? 0,
                  width: 16,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                  color: weeks[i].percentage == null
                      ? Colors.transparent
                      : (weeks[i].percentage! >= threshold
                            ? SasColors.success
                            : SasColors.danger),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
