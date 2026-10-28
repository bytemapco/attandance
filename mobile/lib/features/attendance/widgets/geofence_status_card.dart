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
    final borderCol = isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE3E9F1);

    Color statusColor;
    String statusTitle;
    String statusDesc;

    final distance = state.distanceMeters;
    final radius = state.radiusMeters;

    switch (state.status) {
      case GeofenceStatus.scanning:
        statusColor = const Color(0xFF2583E8);
        statusTitle = 'Checking Location';
        statusDesc = 'Finding your GPS position...';
        break;
      case GeofenceStatus.success:
        statusColor = const Color(0xFF08A875);
        statusTitle = 'Location Verified';
        statusDesc = 'You are inside the classroom boundary.';
        break;
      case GeofenceStatus.failed:
        statusColor = const Color(0xFFF0445E);
        statusTitle = 'Outside Classroom Zone';
        statusDesc = radius != null
            ? 'Must be within ${GeofenceDistanceMetrics.formatDistance(radius)} of class to check in.'
            : 'You are outside the classroom boundary.';
        break;
      default:
        statusColor = const Color(0xFF64748B);
        statusTitle = 'Checking Location';
        statusDesc = '';
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
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
              fontWeight: FontWeight.w700,
              color: statusColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            statusDesc,
            style: GoogleFonts.plusJakartaSans(
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
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
                icon: const Icon(Icons.refresh_rounded, size: 18, color: Colors.white),
                label: Text(
                  'Retry Location',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF95721),
                  elevation: 1,
                  shadowColor: const Color(0xFFF95721).withValues(alpha: 0.35),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
