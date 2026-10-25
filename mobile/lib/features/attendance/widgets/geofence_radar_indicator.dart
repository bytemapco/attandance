import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';

class GeofenceRadarIndicator extends StatefulWidget {
  final GeofenceStatus status;
  final Color color;

  const GeofenceRadarIndicator({
    super.key,
    required this.status,
    required this.color,
  });

  @override
  State<GeofenceRadarIndicator> createState() => _GeofenceRadarIndicatorState();
}

class _GeofenceRadarIndicatorState extends State<GeofenceRadarIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _radarController;

  @override
  void initState() {
    super.initState();
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _radarController.dispose();
    super.dispose();
  }

  IconData _iconForStatus(GeofenceStatus status) {
    switch (status) {
      case GeofenceStatus.scanning:
        return Icons.radar_rounded;
      case GeofenceStatus.success:
        return Icons.task_alt_rounded;
      case GeofenceStatus.failed:
        return Icons.location_off_rounded;
      default:
        return Icons.help_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (widget.status == GeofenceStatus.scanning)
            AnimatedBuilder(
              animation: _radarController,
              builder: (context, _) => CustomPaint(
                size: const Size(70, 70),
                painter: _RadarPainter(progress: _radarController.value, color: widget.color),
              ),
            ),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.color.withValues(alpha: 0.12),
              border: Border.all(color: widget.color.withValues(alpha: 0.4), width: 1.5),
            ),
            child: Icon(_iconForStatus(widget.status), color: widget.color, size: 28),
          ),
        ],
      ),
    );
  }
}

class _RadarPainter extends CustomPainter {
  final double progress;
  final Color color;

  const _RadarPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final trackPaint = Paint()
      ..color = color.withValues(alpha: 0.15)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(center, radius, trackPaint);

    final sweepAngle = math.pi * 0.8;
    final startAngle = (progress * 2 * math.pi) - math.pi / 2;

    final sweepPaint = Paint()
      ..shader = SweepGradient(
        startAngle: startAngle,
        endAngle: startAngle + sweepAngle,
        colors: [Colors.transparent, color.withValues(alpha: 0.4)],
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(Rect.fromCircle(center: center, radius: radius), startAngle, sweepAngle, false)
      ..close();

    canvas.drawPath(path, sweepPaint);
  }

  @override
  bool shouldRepaint(_RadarPainter old) => old.progress != progress;
}
