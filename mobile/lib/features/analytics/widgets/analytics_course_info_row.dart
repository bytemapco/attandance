import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

class AnalyticsCourseInfoRow extends StatelessWidget {
  final String classCode;
  final String courseName;
  final double pct;
  final int present;
  final int total;
  final bool isDark;
  final Color primaryTextColor;
  final Color subtitleColor;

  const AnalyticsCourseInfoRow({
    super.key,
    required this.classCode,
    required this.courseName,
    required this.pct,
    required this.present,
    required this.total,
    required this.isDark,
    required this.primaryTextColor,
    required this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Class code badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkWarningSoft : SasColors.copperSoft,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isDark ? SasColors.copperStrong : SasColors.copperSoft,
              width: 1.0,
            ),
          ),
          child: Text(
            classCode,
            style: SasTypography.style(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: SasColors.copperStrong,
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Title and subtitle
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                courseName,
                style: SasTypography.style(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                '$classCode • $courseName',
                style: SasTypography.style(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: subtitleColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),

        // Percentage & sessions attended
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${pct.toStringAsFixed(0)}%',
              style: SasTypography.style(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: SasColors.copper,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '$present of $total sessions',
              style: SasTypography.style(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: subtitleColor,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
