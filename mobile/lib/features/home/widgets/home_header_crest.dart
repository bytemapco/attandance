import 'package:flutter/material.dart';

/// Top-left curved apricot-orange crest matching reference screenshot.
class HomeHeaderCrest extends StatelessWidget {
  const HomeHeaderCrest({super.key});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        size: const Size(150, 95),
        painter: _HeaderOrangeCrestPainter(),
      ),
    );
  }
}

class _HeaderOrangeCrestPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFFFF7A18),
          Color(0xFFFB923C),
          Color(0xFFFFB273),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    path.moveTo(0, 0);
    path.lineTo(size.width, 0);
    path.quadraticBezierTo(
      size.width * 0.70,
      size.height * 0.20,
      size.width * 0.45,
      size.height * 0.55,
    );
    path.quadraticBezierTo(
      size.width * 0.20,
      size.height * 0.90,
      0,
      size.height,
    );
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
