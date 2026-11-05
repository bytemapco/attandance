import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';

/// Left content of compliance card displaying percentage, goal, and warning badge.
class HomeComplianceInfo extends StatelessWidget {
  /// Null until a class has been held.
  final double? percentage;
  final double threshold;
  final Standing standing;

  const HomeComplianceInfo({
    super.key,
    required this.percentage,
    required this.threshold,
    required this.standing,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final badgeColor = standingColor(standing);
    final goal = '${threshold.toStringAsFixed(0)}%';

    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title with calendar and info badge
        Row(
          children: [
            const Icon(
              Icons.date_range_rounded,
              size: 20,
              color: SasColors.copper,
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                'Term Compliance',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: SasTypography.style(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Container(
              width: 17,
              height: 17,
              decoration: BoxDecoration(
                color: isDark
                    ? SasColors.textSecondary
                    : SasColors.ivory,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  'i',
                  style: TextStyle(
                    color: subtitleColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // 0% Big Stat
        Text(
          percentage == null ? '–' : '${percentage!.toStringAsFixed(0)}%',
          style: SasTypography.style(
            fontSize: 52,
            fontWeight: FontWeight.w600,
            color: primaryTextColor,
            height: 1.0,
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
                color: SasColors.copper,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: 'Goal ',
                      style: SasTypography.style(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w500,
                        color: subtitleColor,
                      ),
                    ),
                    TextSpan(
                      text: goal,
                      style: SasTypography.style(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: primaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Status Warning Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: badgeColor.withValues(alpha: isDark ? 0.18 : 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                standing == Standing.ok
                    ? Icons.check_circle_rounded
                    : Icons.warning_amber_rounded,
                size: 15,
                color: badgeColor,
              ),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  standing == Standing.shortage
                      ? 'Below $goal'
                      : standingLabel(standing),
                  style: SasTypography.style(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
