import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';

class GeofenceDistanceMetrics extends StatelessWidget {
  final GeofenceVerificationState state;
  final Color statusColor;

  const GeofenceDistanceMetrics({
    super.key,
    required this.state,
    required this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    final distance = state.distanceMeters ?? 0;
    final radius = state.radiusMeters ?? 100;
    final progress = (distance / radius).clamp(0.0, 1.5);
    final isInside = state.status == GeofenceStatus.success;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: SasColors.bgCanvas,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: SasColors.glassBorder),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildChip(
                  'Distance',
                  '${distance.toStringAsFixed(0)}m',
                  Icons.near_me_rounded,
                  statusColor,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildChip(
                  'Allowed Radius',
                  '${radius.toStringAsFixed(0)}m',
                  Icons.radio_button_checked_rounded,
                  SasColors.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Boundary status', style: TextStyle(fontSize: 11, color: SasColors.textMuted)),
              Text(
                isInside ? 'Within Range' : 'Outside Range',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor),
              ),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (progress / 1.5).clamp(0.0, 1.0),
              backgroundColor: SasColors.glassBorder,
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
              minHeight: 5,
            ),
          ),
          if (state.accuracy != null) ...[
            const SizedBox(height: 6),
            Text(
              'Accuracy: ±${state.accuracy!.toStringAsFixed(0)}m',
              style: const TextStyle(color: SasColors.textMuted, fontSize: 10),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: SasColors.bgSecondary,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: SasColors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 12),
              const SizedBox(width: 4),
              Text(label, style: const TextStyle(fontSize: 10, color: SasColors.textMuted)),
            ],
          ),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
