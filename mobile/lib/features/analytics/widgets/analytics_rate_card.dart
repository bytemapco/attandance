import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_target_deficit_pill.dart';
import 'package:smart_attendance_app/features/analytics/widgets/attendance_rate_gauge_painter.dart';

/// Card showing overall attendance rate gauge, target percentage, and deficit alert.
class AnalyticsRateCard extends StatelessWidget {
  final double percentage;
  final double target;

  const AnalyticsRateCard({
    super.key,
    required this.percentage,
    required this.target,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    final cleanPct = (percentage.isNaN || percentage.isInfinite)
        ? 0.0
        : percentage.clamp(0.0, 100.0);
    final isBelow = cleanPct < target;
    final diff = (target - cleanPct).abs();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              const Icon(
                Icons.bar_chart_rounded,
                color: Color(0xFFF95721),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Overall Attendance Rate',
                style: SasTypography.style(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: primaryTextColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Content Row: Circular Gauge + Target & Alert
          Row(
            children: [
              // Gauge
              SizedBox(
                width: 104,
                height: 104,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    RepaintBoundary(
                      child: CustomPaint(
                        size: const Size(104, 104),
                        painter: AttendanceRateGaugePainter(
                          progress: cleanPct / 100.0,
                          isDark: isDark,
                        ),
                      ),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${cleanPct.toStringAsFixed(1)}%',
                          style: SasTypography.style(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: primaryTextColor,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Overall\nattendance',
                          textAlign: TextAlign.center,
                          style: SasTypography.style(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w500,
                            color: subtitleColor,
                            height: 1.15,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),

              // Target & Deficit Pill
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Target',
                      style: SasTypography.style(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: subtitleColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${target.toStringAsFixed(0)}%',
                      style: SasTypography.style(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: primaryTextColor,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Alert Pill
                    AnalyticsTargetDeficitPill(
                      isBelow: isBelow,
                      isDark: isDark,
                      diff: diff,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
