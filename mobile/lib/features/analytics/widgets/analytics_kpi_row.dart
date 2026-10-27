import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Row of 4 pastel KPI metric cards: Total, Present, Absent, and Flagged.
class AnalyticsKpiRow extends StatelessWidget {
  final int total;
  final int present;
  final int absent;
  final int flagged;

  const AnalyticsKpiRow({
    super.key,
    required this.total,
    required this.present,
    required this.absent,
    required this.flagged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.groups_rounded,
            iconColor: const Color(0xFF0284C7),
            lightBgColor: const Color(0xFFF0F9FF),
            lightBorderColor: const Color(0xFFBAE6FD),
            count: '$total',
            label: 'Total',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.check_circle_rounded,
            iconColor: const Color(0xFF10B981),
            lightBgColor: const Color(0xFFECFDF5),
            lightBorderColor: const Color(0xFFBBF7D0),
            count: '$present',
            label: 'Present',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.cancel_rounded,
            iconColor: const Color(0xFFEF4444),
            lightBgColor: const Color(0xFFFFF1F2),
            lightBorderColor: const Color(0xFFFECDD3),
            count: '$absent',
            label: 'Absent',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.flag_rounded,
            iconColor: const Color(0xFFF59E0B),
            lightBgColor: const Color(0xFFFFFBEB),
            lightBorderColor: const Color(0xFFFDE68A),
            count: '$flagged',
            label: 'Flagged',
          ),
        ),
      ],
    );
  }
}

class _KpiMetricCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color lightBgColor;
  final Color lightBorderColor;
  final String count;
  final String label;

  const _KpiMetricCard({
    required this.icon,
    required this.iconColor,
    required this.lightBgColor,
    required this.lightBorderColor,
    required this.count,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : lightBgColor;
    final borderColor = isDark ? const Color(0x1FFFFFFF) : lightBorderColor;
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: iconColor, size: 21),
          const SizedBox(height: 6),
          Text(
            count,
            style: SasTypography.style(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: primaryTextColor,
              height: 1.0,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: SasTypography.style(
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              color: subtitleColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
