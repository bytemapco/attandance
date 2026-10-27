import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

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
                    CustomPaint(
                      size: const Size(104, 104),
                      painter: _AttendanceRateGaugePainter(
                        progress: cleanPct / 100.0,
                        isDark: isDark,
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
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isBelow
                            ? (isDark ? const Color(0xFF3F1D24) : const Color(0xFFFFF1F2))
                            : (isDark ? const Color(0xFF143828) : const Color(0xFFF0FDF4)),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isBelow
                              ? (isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFECDD3))
                              : (isDark ? const Color(0xFF15803D) : const Color(0xFFBBF7D0)),
                          width: 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isBelow
                                ? Icons.warning_amber_rounded
                                : Icons.check_circle_outline_rounded,
                            size: 18,
                            color: isBelow
                                ? const Color(0xFFEF4444)
                                : const Color(0xFF16A34A),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              isBelow
                                  ? '${diff.toStringAsFixed(0)} percentage points\nbelow target'
                                  : 'Target met\nsuccessfully',
                              style: SasTypography.style(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isBelow
                                    ? const Color(0xFFE11D48)
                                    : const Color(0xFF16A34A),
                                height: 1.2,
                              ),
                            ),
                          ),
                        ],
                      ),
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

class _AttendanceRateGaugePainter extends CustomPainter {
  final double progress;
  final bool isDark;

  const _AttendanceRateGaugePainter({
    required this.progress,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 8.0) / 2;

    // Outer track
    final trackPaint = Paint()
      ..color = isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7.0
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Active arc
    final arcPaint = Paint()
      ..color = const Color(0xFFF95721)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7.0
      ..strokeCap = StrokeCap.round;

    if (progress <= 0.005) {
      // Prominent top pip when zero
      final pipPaint = Paint()
        ..color = const Color(0xFFF95721)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(
        Offset(center.dx, center.dy - radius),
        4.0,
        pipPaint,
      );
    } else {
      final sweep = progress.clamp(0.02, 1.0) * 2 * math.pi;
      final rect = Rect.fromCircle(center: center, radius: radius);
      canvas.drawArc(rect, -math.pi / 2, sweep, false, arcPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _AttendanceRateGaugePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.isDark != isDark;
}
