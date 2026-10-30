import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
            color: isDark ? const Color(0xFF332314) : const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isDark ? const Color(0xFF7C2D12) : const Color(0xFFFED7AA),
              width: 1.0,
            ),
          ),
          child: Text(
            classCode,
            style: SasTypography.style(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: const Color(0xFFEA580C),
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
                  fontWeight: FontWeight.w700,
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
                fontWeight: FontWeight.w800,
                color: const Color(0xFFF95721),
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
