import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/geofence_distance_metrics.dart';
import 'package:smart_attendance_app/features/attendance/widgets/geofence_radar_indicator.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class GeofenceStatusCard extends StatelessWidget {
  final GeofenceVerificationState state;
  final VoidCallback onRetry;

  const GeofenceStatusCard({
    super.key,
    required this.state,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (state.status == GeofenceStatus.idle) return const SizedBox.shrink();

    Color statusColor;
    String statusTitle;
    String statusDesc;

    switch (state.status) {
      case GeofenceStatus.scanning:
        statusColor = SasColors.info;
        statusTitle = 'Checking Location';
        statusDesc = 'Checking your location in the classroom...';
        break;
      case GeofenceStatus.success:
        statusColor = SasColors.accentEmerald;
        statusTitle = 'Location Confirmed';
        statusDesc = 'You are inside the classroom boundary.';
        break;
      case GeofenceStatus.failed:
        statusColor = SasColors.danger;
        statusTitle = 'Outside Classroom';
        statusDesc = state.errorMessage ?? 'You appear to be outside the classroom.';
        break;
      default:
        statusColor = SasColors.textMuted;
        statusTitle = 'Checking Location';
        statusDesc = '';
    }

    return GlassCard(
      borderColor: statusColor.withValues(alpha: 0.35),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GeofenceRadarIndicator(status: state.status, color: statusColor),
          const SizedBox(height: 12),
          Text(
            statusTitle,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: statusColor),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            statusDesc,
            style: const TextStyle(color: SasColors.textSecondary, fontSize: 12),
            textAlign: TextAlign.center,
          ),
          if (state.distanceMeters != null && state.radiusMeters != null) ...[
            const SizedBox(height: 12),
            GeofenceDistanceMetrics(state: state, statusColor: statusColor),
          ],
          if (state.status == GeofenceStatus.failed) ...[
            const SizedBox(height: 12),
            GlassButton(
              label: 'Retry GPS Verification',
              icon: Icons.refresh_rounded,
              isExpanded: true,
              onPressed: onRetry,
            ),
          ],
        ],
      ),
    );
  }
}
