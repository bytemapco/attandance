import 'package:flutter/material.dart';
import 'package:smart_attendance_app/features/home/widgets/home_compliance_arc.dart';
import 'package:smart_attendance_app/features/home/widgets/home_compliance_info.dart';

/// Hero compliance widget featuring navy background with glowing orange fluid wave.
class HomeComplianceCard extends StatelessWidget {
  final double percentage;
  final VoidCallback onTap;

  const HomeComplianceCard({
    super.key,
    required this.percentage,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final clampedPct = (percentage / 100.0).clamp(0.0, 1.0);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        height: 198,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: const Color(0xFF15203A),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.35),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              // Bottom-right smooth sweeping fluid orange wave
              Positioned.fill(
                child: CustomPaint(
                  painter: _ComplianceWavePainter(),
                ),
              ),

              // Content Padding
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: HomeComplianceInfo(percentage: percentage),
                    ),
                    HomeComplianceArc(
                      progress: clampedPct,
                      size: 126,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ComplianceWavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Ambient bottom-right radial glow
    final glowPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0.85, 0.85),
        radius: 0.85,
        colors: [
          const Color(0xFFF95721).withValues(alpha: 0.45),
          const Color(0xFFF95721).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), glowPaint);

    // Dynamic sweeping fluid wave at bottom-right
    final wavePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
        colors: [
          Color(0xFFE65100),
          Color(0xFFF95721),
          Color(0xFFFB923C),
        ],
        stops: [0.0, 0.55, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    path.moveTo(size.width * 0.42, size.height);
    path.quadraticBezierTo(
      size.width * 0.58,
      size.height * 0.88,
      size.width * 0.72,
      size.height * 0.82,
    );
    path.quadraticBezierTo(
      size.width * 0.88,
      size.height * 0.76,
      size.width,
      size.height * 0.42,
    );
    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, wavePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
