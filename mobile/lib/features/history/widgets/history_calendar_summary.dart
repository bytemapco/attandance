import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Legend row displaying colored status dots for calendar events.
class HistoryCalendarLegend extends StatelessWidget {
  final bool isDark;

  const HistoryCalendarLegend({super.key, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _LegendItem(color: Color(0xFF10B981), label: 'Present'),
          _LegendItem(color: Color(0xFFEF4444), label: 'Absent'),
          _LegendItem(color: Color(0xFFF59E0B), label: 'Excused'),
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
        ? const Color(0xFFCBD5E1)
        : const Color(0xFF64748B);

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
          countColor: const Color(0xFF10B981),
        ),
        _StatCountColumn(
          count: '$absent',
          label: 'Absent',
          countColor: const Color(0xFFEF4444),
        ),
        _StatCountColumn(
          count: '$excused',
          label: 'Excused',
          countColor: const Color(0xFFF59E0B),
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
        ? const Color(0xFFCBD5E1)
        : const Color(0xFF64748B);

    return Expanded(
      child: Column(
        children: [
          Text(
            count,
            style: SasTypography.style(
              fontSize: 22,
              fontWeight: FontWeight.w800,
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
