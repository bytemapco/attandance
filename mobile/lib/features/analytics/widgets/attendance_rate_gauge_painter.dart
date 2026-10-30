import 'dart:math' as math;
import 'package:flutter/material.dart';

class AttendanceRateGaugePainter extends CustomPainter {
  final double progress;
  final bool isDark;

  const AttendanceRateGaugePainter({
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
      canvas.drawCircle(Offset(center.dx, center.dy - radius), 4.0, pipPaint);
    } else {
      final sweep = progress.clamp(0.02, 1.0) * 2 * math.pi;
      final rect = Rect.fromCircle(center: center, radius: radius);
      canvas.drawArc(rect, -math.pi / 2, sweep, false, arcPaint);
    }
  }

  @override
  bool shouldRepaint(covariant AttendanceRateGaugePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.isDark != isDark;
}
