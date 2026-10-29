import 'package:flutter/material.dart';

/// Reticle viewfinder overlay with animated scanning laser beam and corner guides.
class ScannerReticleOverlay extends StatefulWidget {
  final Color guideColor;

  const ScannerReticleOverlay({
    super.key,
    this.guideColor = const Color(0xFFF95721),
  });

  @override
  State<ScannerReticleOverlay> createState() => _ScannerReticleOverlayState();
}

class _ScannerReticleOverlayState extends State<ScannerReticleOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _laserAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    _laserAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxSize = (constraints.maxWidth * 0.68).clamp(180.0, 240.0);
        final left = (constraints.maxWidth - boxSize) / 2;
        final top = (constraints.maxHeight - boxSize) / 2;
        final rect = Rect.fromLTWH(left, top, boxSize, boxSize);

        return Stack(
          fit: StackFit.expand,
          children: [
            CustomPaint(
              painter: _ViewfinderScrimPainter(
                cutoutRect: rect,
                guideColor: widget.guideColor,
              ),
            ),
            AnimatedBuilder(
              animation: _laserAnimation,
              builder: (context, child) {
                final laserY = top + (boxSize * _laserAnimation.value);
                return Positioned(
                  left: left + 12,
                  right: left + 12,
                  top: laserY,
                  child: Container(
                    height: 2.5,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          widget.guideColor.withValues(alpha: 0.0),
                          widget.guideColor,
                          widget.guideColor.withValues(alpha: 0.0),
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: widget.guideColor.withValues(alpha: 0.65),
                          blurRadius: 8,
                          spreadRadius: 1.5,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _ViewfinderScrimPainter extends CustomPainter {
  final Rect cutoutRect;
  final Color guideColor;

  _ViewfinderScrimPainter({required this.cutoutRect, required this.guideColor});

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.42)
      ..style = PaintingStyle.fill;

    final backgroundPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutoutPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(cutoutRect, const Radius.circular(16)),
      );

    final finalPath = Path.combine(
      PathOperation.difference,
      backgroundPath,
      cutoutPath,
    );
    canvas.drawPath(finalPath, backgroundPaint);

    final bracketPaint = Paint()
      ..color = guideColor
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    const cornerLength = 22.0;
    final r = cutoutRect;

    // Top-left corner
    canvas.drawLine(
      Offset(r.left, r.top + cornerLength),
      Offset(r.left, r.top),
      bracketPaint,
    );
    canvas.drawLine(
      Offset(r.left, r.top),
      Offset(r.left + cornerLength, r.top),
      bracketPaint,
    );

    // Top-right corner
    canvas.drawLine(
      Offset(r.right - cornerLength, r.top),
      Offset(r.right, r.top),
      bracketPaint,
    );
    canvas.drawLine(
      Offset(r.right, r.top),
      Offset(r.right, r.top + cornerLength),
      bracketPaint,
    );

    // Bottom-left corner
    canvas.drawLine(
      Offset(r.left, r.bottom - cornerLength),
      Offset(r.left, r.bottom),
      bracketPaint,
    );
    canvas.drawLine(
      Offset(r.left, r.bottom),
      Offset(r.left + cornerLength, r.bottom),
      bracketPaint,
    );

    // Bottom-right corner
    canvas.drawLine(
      Offset(r.right - cornerLength, r.bottom),
      Offset(r.right, r.bottom),
      bracketPaint,
    );
    canvas.drawLine(
      Offset(r.right, r.bottom),
      Offset(r.right, r.bottom - cornerLength),
      bracketPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ViewfinderScrimPainter oldDelegate) {
    return oldDelegate.cutoutRect != cutoutRect ||
        oldDelegate.guideColor != guideColor;
  }
}
