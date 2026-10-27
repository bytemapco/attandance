import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Circular progress gauge with calendar checkmark icon matching exact reference design.
class HomeComplianceArc extends StatelessWidget {
  final double progress;
  final double size;

  const HomeComplianceArc({
    super.key,
    required this.progress,
    this.size = 126,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Darker navy inner circular backing disc
          Container(
            width: size - 14,
            height: size - 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF131D33).withValues(alpha: 0.55),
            ),
          ),

          // Track and active orange progress arc
          CustomPaint(
            size: Size(size, size),
            painter: _ArcPainter(
              progress: progress > 0 ? progress : 0.35,
              strokeWidth: 9.5,
            ),
          ),

          // White calendar with checkmark icon matching reference
          const Icon(
            Icons.event_available_rounded,
            color: Colors.white,
            size: 32,
          ),
        ],
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  final double progress;
  final double strokeWidth;

  const _ArcPainter({required this.progress, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track circular ring
    final trackPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.12)
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
    canvas.drawArc(rect, -math.pi / 4, math.pi * 1.5 * progress, false, arcPaint);
  }

  @override
  bool shouldRepaint(covariant _ArcPainter old) =>
      old.progress != progress || old.strokeWidth != strokeWidth;
}
