import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Circular progress gauge with calendar checkmark icon matching exact reference design.
class HomeComplianceArc extends StatelessWidget {
  final double progress;
  final double size;

  const HomeComplianceArc({super.key, required this.progress, this.size = 124});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final trackColor = isDark
        ? const Color(0xFF334155)
        : const Color(0xFFEEF2F6);
    final iconColor = isDark ? Colors.white : const Color(0xFF475569);

    final displayProgress = progress.clamp(0.0, 1.0);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Track and active orange progress arc
          RepaintBoundary(
            child: CustomPaint(
              size: Size(size, size),
              painter: _ArcPainter(
                progress: displayProgress,
                trackColor: trackColor,
                strokeWidth: 10.0,
              ),
            ),
          ),

          // Clean calendar with checkmark outline icon
          Icon(Icons.event_available_rounded, color: iconColor, size: 28),
        ],
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final double strokeWidth;

  const _ArcPainter({
    required this.progress,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track circular ring
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Active vibrant orange progress arc
    final arcPaint = Paint()
      ..color = const Color(0xFFF95721)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromCircle(center: center, radius: radius);
    canvas.drawArc(rect, -math.pi / 4, math.pi * 2 * progress, false, arcPaint);
  }

  @override
  bool shouldRepaint(covariant _ArcPainter old) =>
      old.progress != progress ||
      old.trackColor != trackColor ||
      old.strokeWidth != strokeWidth;
}
