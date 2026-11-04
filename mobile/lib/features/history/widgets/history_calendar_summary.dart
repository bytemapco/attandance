import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Legend row displaying colored status dots for calendar events.
class HistoryCalendarLegend extends StatelessWidget {
  final bool isDark;

  const HistoryCalendarLegend({super.key, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? SasColors.ink : SasColors.ivory,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _LegendItem(color: SasColors.success, label: 'Present'),
          _LegendItem(color: SasColors.danger, label: 'Absent'),
          _LegendItem(color: SasColors.warning, label: 'Excused'),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark
        ? SasColors.textOnDark
        : SasColors.textMuted;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: SasTypography.style(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ],
    );
  }
}

/// 3-column stats row displaying monthly counts for Present, Absent, and Excused.
class HistoryCalendarStatsRow extends StatelessWidget {
  final int present;
  final int absent;
  final int excused;

  const HistoryCalendarStatsRow({
    super.key,
    required this.present,
    required this.absent,
    required this.excused,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatCountColumn(
          count: '$present',
          label: 'Present',
          countColor: SasColors.success,
        ),
        _StatCountColumn(
          count: '$absent',
          label: 'Absent',
          countColor: SasColors.danger,
        ),
        _StatCountColumn(
          count: '$excused',
          label: 'Excused',
          countColor: SasColors.warning,
        ),
      ],
    );
  }
}

class _StatCountColumn extends StatelessWidget {
  final String count;
  final String label;
  final Color countColor;

  const _StatCountColumn({
    required this.count,
    required this.label,
    required this.countColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subtitleColor = isDark
        ? SasColors.textOnDark
        : SasColors.textMuted;

    return Expanded(
      child: Column(
        children: [
          Text(
            count,
            style: SasTypography.style(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: countColor,
              height: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: SasTypography.style(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: subtitleColor,
            ),
          ),
        ],
      ),
    );
  }
}
