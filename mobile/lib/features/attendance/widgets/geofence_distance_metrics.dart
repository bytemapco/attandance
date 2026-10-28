import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/geofence_metric_box.dart';

class GeofenceDistanceMetrics extends StatelessWidget {
  final GeofenceVerificationState state;
  final Color statusColor;

  const GeofenceDistanceMetrics({
    super.key,
    required this.state,
    required this.statusColor,
  });

  static String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.round()} m';
    } else if (meters < 10000) {
      return '${(meters / 1000).toStringAsFixed(1)} km';
    } else {
      final km = (meters / 1000).round();
      return '${NumberFormat('#,###').format(km)} km';
    }
  }

  @override
  Widget build(BuildContext context) {
    final distance = state.distanceMeters ?? 0;
    final radius = state.radiusMeters ?? 100;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final containerBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final borderCol = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final mutedTextCol = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: containerBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: GeofenceMetricBox(
                  label: 'Current Distance',
                  meters: distance,
                  icon: Icons.near_me_rounded,
                  accentColor: statusColor,
                  isDark: isDark,
                  borderColor: borderCol,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: GeofenceMetricBox(
                  label: 'Allowed Radius',
                  meters: radius,
                  icon: Icons.radio_button_checked_rounded,
                  accentColor: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                  isDark: isDark,
                  borderColor: borderCol,
                ),
              ),
            ],
          ),
          if (state.accuracy != null) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.gps_fixed_rounded, size: 12, color: mutedTextCol),
                const SizedBox(width: 4),
                Text(
                  'GPS accuracy ±${state.accuracy!.toStringAsFixed(0)} m',
                  style: GoogleFonts.plusJakartaSans(
                    color: mutedTextCol,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
