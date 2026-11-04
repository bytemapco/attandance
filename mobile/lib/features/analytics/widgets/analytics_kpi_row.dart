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
            iconColor: SasColors.info,
            lightBgColor: SasColors.infoSoft,
            lightBorderColor: SasColors.infoBorder,
            count: '$total',
            label: 'Total',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.check_circle_rounded,
            iconColor: SasColors.success,
            lightBgColor: SasColors.successSoft,
            lightBorderColor: SasColors.successBorder,
            count: '$present',
            label: 'Present',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.cancel_rounded,
            iconColor: SasColors.danger,
            lightBgColor: SasColors.dangerSoft,
            lightBorderColor: SasColors.dangerBorder,
            count: '$absent',
            label: 'Absent',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _KpiMetricCard(
            icon: Icons.flag_rounded,
            iconColor: SasColors.warning,
            lightBgColor: SasColors.warningSoft,
            lightBorderColor: SasColors.warningBorder,
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
    final cardBg = isDark ? SasColors.darkSurface : lightBgColor;
    final borderColor = isDark ? SasColors.darkBorder : lightBorderColor;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1.0),
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
              fontWeight: FontWeight.w600,
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
