import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Left content of compliance card displaying percentage, goal, and warning badge.
class HomeComplianceInfo extends StatelessWidget {
  final double percentage;

  const HomeComplianceInfo({super.key, required this.percentage});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isBelowGoal = percentage < 75.0;

    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title with calendar and info badge
        Row(
          children: [
            const Icon(
              Icons.date_range_rounded,
              size: 20,
              color: Color(0xFFF95721),
            ),
            const SizedBox(width: 8),
            Text(
              'Term Compliance',
              style: SasTypography.style(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: primaryTextColor,
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              width: 17,
              height: 17,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF334155)
                    : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  'i',
                  style: TextStyle(
                    color: subtitleColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
        const Spacer(),

        // 0% Big Stat
        Text(
          '${percentage.toStringAsFixed(0)}%',
          style: SasTypography.style(
            fontSize: 52,
            fontWeight: FontWeight.w800,
            color: primaryTextColor,
            height: 1.0,
            letterSpacing: -1.5,
          ),
        ),
        const SizedBox(height: 8),

        // Goal 75% Row
        Row(
          children: [
            Container(
              width: 3.5,
              height: 14,
              decoration: BoxDecoration(
                color: const Color(0xFFF95721),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              'Goal ',
              style: SasTypography.style(
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                color: subtitleColor,
              ),
            ),
            Text(
              '75%',
              style: SasTypography.style(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: primaryTextColor,
              ),
            ),
          ],
        ),
        const Spacer(),

        // Status Warning Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isBelowGoal
                ? (isDark ? const Color(0x33F87171) : const Color(0xFFFEE2E2))
                : (isDark ? const Color(0x3334D399) : const Color(0xFFDCFCE7)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isBelowGoal
                    ? Icons.warning_amber_rounded
                    : Icons.check_circle_rounded,
                size: 15,
                color: isBelowGoal
                    ? const Color(0xFFEF4444)
                    : const Color(0xFF16A34A),
              ),
              const SizedBox(width: 5),
              Text(
                isBelowGoal ? 'Below 75%' : 'Good Standing',
                style: SasTypography.style(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isBelowGoal
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF16A34A),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
