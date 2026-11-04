import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Top header for Attendance Log screen with title and circular overall gauge.
class HistoryHeader extends StatelessWidget {
  final double percentage;

  const HistoryHeader({super.key, required this.percentage});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    final cleanPct = (percentage.isNaN || percentage.isInfinite)
        ? 0.0
        : percentage.clamp(0.0, 100.0);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Title & subtitle
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Attendance Log',
                style: SasTypography.style(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'Your attendance across all courses',
                style: SasTypography.style(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: subtitleColor,
                ),
              ),
            ],
          ),
        ),

        // Circular Overall Attendance Gauge
        Container(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkSurface : Colors.white,
            shape: BoxShape.circle,
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              RepaintBoundary(
                child: CustomPaint(
                  size: const Size(50, 50),
                  painter: _OverallGaugePainter(
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
                    '${cleanPct.toStringAsFixed(0)}%',
                    style: SasTypography.style(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: SasColors.copper,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 1.5),
                  Text(
                    'Overall',
                    style: SasTypography.style(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: subtitleColor,
                      height: 1.0,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OverallGaugePainter extends CustomPainter {
  final double progress;
  final bool isDark;

  const _OverallGaugePainter({required this.progress, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 5.0) / 2;

    // Track
    final trackPaint = Paint()
      ..color = isDark ? SasColors.textSecondary : SasColors.copperSoft
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Active arc
    final arcPaint = Paint()
      ..color = SasColors.copper
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;

    final sweep = math.max(0.06, progress) * 2 * math.pi;
    final rect = Rect.fromCircle(center: center, radius: radius);
    canvas.drawArc(rect, -math.pi / 2, sweep, false, arcPaint);
  }

  @override
  bool shouldRepaint(covariant _OverallGaugePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.isDark != isDark;
}
