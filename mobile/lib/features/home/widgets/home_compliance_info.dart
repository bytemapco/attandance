import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Left content of compliance card displaying percentage, goal, and warning badge.
class HomeComplianceInfo extends StatelessWidget {
  final double percentage;

  const HomeComplianceInfo({super.key, required this.percentage});

  @override
  Widget build(BuildContext context) {
    final isBelowGoal = percentage < 75.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title with calendar and info badge
        Row(
          children: [
            const Icon(
              Icons.date_range_rounded,
              size: 18,
              color: Color(0xFFF95721),
            ),
            const SizedBox(width: 8),
            Text(
              'Term Compliance',
              style: SasTypography.style(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text(
                  'i',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
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
            fontSize: 54,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            height: 1.0,
            letterSpacing: -1.5,
          ),
        ),
        const SizedBox(height: 7),

        // Goal 75% Row
        Row(
          children: [
            Container(
              width: 3.5,
              height: 13,
              decoration: BoxDecoration(
                color: const Color(0xFFF95721),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              'Goal ',
              style: SasTypography.style(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFFCBD5E1),
              ),
            ),
            Text(
              '75%',
              style: SasTypography.style(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const Spacer(),

        // Status Warning Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isBelowGoal
                    ? Icons.warning_amber_rounded
                    : Icons.check_circle_rounded,
                size: 16,
                color: isBelowGoal
                    ? const Color(0xFFF95721)
                    : const Color(0xFF10B981),
              ),
              const SizedBox(width: 6),
              Text(
                isBelowGoal ? 'Below 75%' : 'Good Standing',
                style: SasTypography.style(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: isBelowGoal
                      ? const Color(0xFFF95721)
                      : const Color(0xFF10B981),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
