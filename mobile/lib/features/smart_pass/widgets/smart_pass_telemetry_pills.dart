import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Telemetry status pill badges indicating GPS and device readiness.
class SmartPassTelemetryPills extends StatelessWidget {
  const SmartPassTelemetryPills({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _telemetryBadge(
          context: context,
          icon: Icons.my_location_rounded,
          label: 'GPS Active',
          color: SasColors.accentEmerald,
        ),
        const SizedBox(width: 8),
        _telemetryBadge(
          context: context,
          icon: Icons.phonelink_lock_rounded,
          label: 'Device Verified',
          color: SasColors.accentEmerald,
        ),
      ],
    );
  }

  Widget _telemetryBadge({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.15 : 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
