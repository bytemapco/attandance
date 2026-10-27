import 'package:flutter/material.dart';

/// Custom painter rendering the soft organic warm waves at the bottom corners
/// matching the reference design.
class AuthWavePainter extends CustomPainter {
  final bool isDark;

  const AuthWavePainter({this.isDark = false});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Layer 1: soft base wave (light golden peach glow)
    final paint1 = Paint()
      ..color = isDark
          ? const Color(0xFFF97316).withValues(alpha: 0.12)
          : const Color(0xFFFFEDD5).withValues(alpha: 0.90)
      ..style = PaintingStyle.fill;

    final path1 = Path()
      ..moveTo(0, h * 0.25)
      ..cubicTo(w * 0.32, h * 0.05, w * 0.65, h * 0.60, w, h * 0.20)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(path1, paint1);

    // Layer 2: middle flowing wave (warm apricot orange)
    final paint2 = Paint()
      ..color = isDark
          ? const Color(0xFFEA580C).withValues(alpha: 0.18)
          : const Color(0xFFFED7AA).withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;

    final path2 = Path()
      ..moveTo(0, h * 0.48)
      ..cubicTo(w * 0.38, h * 0.28, w * 0.68, h * 0.72, w, h * 0.40)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(path2, paint2);

    // Layer 3: foreground warm radiant sunset wave
    final paint3 = Paint()
      ..color = isDark
          ? const Color(0xFFC2410C).withValues(alpha: 0.25)
          : const Color(0xFFFDBA74).withValues(alpha: 0.75)
      ..style = PaintingStyle.fill;

    final path3 = Path()
      ..moveTo(0, h * 0.72)
      ..cubicTo(w * 0.35, h * 0.52, w * 0.72, h * 0.82, w, h * 0.62)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(path3, paint3);
  }

  @override
  bool shouldRepaint(covariant AuthWavePainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
