import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/permission_service.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

/// Card explaining GPS or location permissions needed for Smart Pass scan.
class SmartPassPermissionCard extends StatelessWidget {
  final PermissionStatusResult? permissionStatus;
  final bool isChecking;
  final VoidCallback onRequestPermissions;

  const SmartPassPermissionCard({
    super.key,
    required this.permissionStatus,
    required this.isChecking,
    required this.onRequestPermissions,
  });

  @override
  Widget build(BuildContext context) {
    final isPermanent = permissionStatus?.isPermanentlyDenied ?? false;
    final isGpsOff = !(permissionStatus?.isLocationServiceEnabled ?? true);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderColor = isDark
        ? const Color(0x1EFFFFFF)
        : const Color(0x140F172A);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: SasColors.warning.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isGpsOff
                  ? Icons.location_disabled_rounded
                  : Icons.location_searching_rounded,
              size: 40,
              color: SasColors.warning,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isGpsOff
                ? 'Device GPS Is Turned Off'
                : 'Location Permission Required',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: SasColors.textPrimaryOf(context),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isGpsOff
                ? 'Please enable GPS/Location services on your device to verify class attendance.'
                : isPermanent
                ? 'Location access is permanently disabled. Please tap below to open App Settings and grant permission.'
                : 'Classroom verification requires physical location proximity using GPS.',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: SasColors.textMutedOf(context),
            ),
          ),
          const SizedBox(height: 18),
          GlassButton(
            label: isPermanent
                ? 'Open App Settings'
                : isGpsOff
                ? 'Turn On GPS'
                : 'Grant Permission',
            icon: Icons.check_circle_outline_rounded,
            isLoading: isChecking,
            onPressed: isChecking ? null : onRequestPermissions,
          ),
        ],
      ),
    );
  }
}
