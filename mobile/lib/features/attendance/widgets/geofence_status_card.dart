import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/geofence_distance_metrics.dart';
import 'package:smart_attendance_app/features/attendance/widgets/geofence_radar_indicator.dart';

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

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? SasColors.darkBorder
        : SasColors.border;

    Color statusColor;
    String statusTitle;
    String statusDesc;

    final distance = state.distanceMeters;
    final radius = state.radiusMeters;

    switch (state.status) {
      case GeofenceStatus.scanning:
        statusColor = SasColors.info;
        statusTitle = 'Checking Location';
        statusDesc = 'Finding your GPS position...';
        break;
      case GeofenceStatus.success:
        statusColor = SasColors.success;
        statusTitle = 'Location Verified';
        statusDesc = 'You are inside the classroom boundary.';
        break;
      case GeofenceStatus.notConfigured:
        statusColor = SasColors.warning;
        statusTitle = 'Campus Location Not Set';
        statusDesc =
            'Your institution has not set the campus location. '
            'Your attendance will be flagged for teacher review.';
        break;
      case GeofenceStatus.failed:
        statusColor = SasColors.danger;
        statusTitle = state.distanceMeters != null
            ? 'Outside Campus Zone'
            : 'Location Unavailable';
        statusDesc =
            state.errorMessage ??
            (radius != null
                ? 'Must be within ${GeofenceDistanceMetrics.formatDistance(radius)} of campus to check in.'
                : kOutsideBoundaryMessage);
        break;
      default:
        statusColor = SasColors.textMuted;
        statusTitle = 'Checking Location';
        statusDesc = '';
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GeofenceRadarIndicator(status: state.status, color: statusColor),
          const SizedBox(height: 14),
          Text(
            statusTitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16.5,
              fontWeight: FontWeight.w600,
              color: statusColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            statusDesc,
            style: GoogleFonts.plusJakartaSans(
              color: isDark ? SasColors.mutedOnDark : SasColors.textMuted,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          if (distance != null && radius != null) ...[
            const SizedBox(height: 14),
            GeofenceDistanceMetrics(state: state, statusColor: statusColor),
          ],
          if (state.status == GeofenceStatus.failed) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(
                  Icons.refresh_rounded,
                  size: 18,
                  color: Colors.white,
                ),
                label: Text(
                  'Retry Location',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: SasColors.copper,
                  elevation: 1,
                  shadowColor: SasColors.copper.withValues(alpha: 0.35),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
