import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Top header for Performance / Analytics screen with title and "Last 4 weeks" dropdown pill.
class AnalyticsHeader extends StatelessWidget {
  final VoidCallback? onFilterTap;

  const AnalyticsHeader({super.key, this.onFilterTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Title & subtitle
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Performance',
                style: SasTypography.style(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'Analytics & insights',
                style: SasTypography.style(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: subtitleColor,
                ),
              ),
            ],
          ),
        ),

        // "Last 4 weeks" dropdown pill
        InkWell(
          onTap: onFilterTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7.5),
            decoration: BoxDecoration(
              color: isDark ? SasColors.darkSurface : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark
                    ? SasColors.darkBorder
                    : SasColors.textOnDark,
                width: 1.0,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.calendar_today_outlined,
                  size: 14,
                  color: isDark
                      ? SasColors.ivory
                      : SasColors.ink,
                ),
                const SizedBox(width: 6),
                Text(
                  'Last 4 weeks',
                  style: SasTypography.style(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? SasColors.ivory
                        : SasColors.ink,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  size: 18,
                  color: subtitleColor,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
