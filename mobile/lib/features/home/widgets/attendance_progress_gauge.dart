import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Precision radial attendance gauge inspired by Apple Health & Fitness rings.
class AttendanceProgressGauge extends StatelessWidget {
  final double overallPct;
  final bool isCompliant;
  final double size;

  const AttendanceProgressGauge({
    super.key,
    required this.overallPct,
    required this.isCompliant,
    this.size = 82,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final clampedPct = (overallPct / 100.0).clamp(0.0, 1.0);

    final List<Color> gradientColors = isCompliant
        ? const [Color(0xFF059669), Color(0xFF10B981), Color(0xFF34D399)]
        : overallPct < 50
        ? const [Color(0xFFE11D48), Color(0xFFF43F5E), Color(0xFFFB7185)]
        : const [Color(0xFFEA580C), Color(0xFFF6A242), Color(0xFFFBBF24)];

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          RepaintBoundary(
            child: CustomPaint(
              size: Size(size, size),
              painter: _RingPainter(
                progress: clampedPct,
                gradientColors: gradientColors,
                trackColor: isDark
                    ? const Color(0x2EBAC0BE)
                    : const Color(0x1FBAC0BE),
                strokeWidth: 8.0,
              ),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${overallPct.toStringAsFixed(0)}%',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                  color: isDark ? SasColors.brilliance : SasColors.indianInk,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                'GOAL 75%',
                style: TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                  color: SasColors.textSecondaryOf(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final List<Color> gradientColors;
  final Color trackColor;
  final double strokeWidth;

  _RingPainter({
    required this.progress,
    required this.gradientColors,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background track
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    if (progress <= 0) return;

    // Active progress arc with sweep gradient
    final rect = Rect.fromCircle(center: center, radius: radius);
    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;

    final arcPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        startAngle: 0.0,
        endAngle: 2 * math.pi,
        colors: gradientColors,
        transform: const GradientRotation(-math.pi / 2),
      ).createShader(rect);

    canvas.drawArc(rect, startAngle, sweepAngle, false, arcPaint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.trackColor != trackColor ||
      oldDelegate.strokeWidth != strokeWidth;
}
