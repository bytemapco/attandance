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
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

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
                  fontWeight: FontWeight.w800,
                  color: primaryTextColor,
                  letterSpacing: -0.6,
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
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7.5),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E2838) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark
                    ? const Color(0x1FFFFFFF)
                    : const Color(0xFFE2E8F0),
                width: 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.calendar_today_outlined,
                  size: 14,
                  color: isDark
                      ? SasColors.brilliance
                      : const Color(0xFF0F172A),
                ),
                const SizedBox(width: 6),
                Text(
                  'Last 4 weeks',
                  style: SasTypography.style(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? SasColors.brilliance
                        : const Color(0xFF0F172A),
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
