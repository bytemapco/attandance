import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

/// Error fallback state displayed when camera initialization or permissions fail.
class SmartPassCameraError extends StatelessWidget {
  final MobileScannerException error;
  final VoidCallback onRetry;

  const SmartPassCameraError({
    super.key,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black87,
      padding: const EdgeInsets.all(20),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.videocam_off_rounded,
              size: 40,
              color: SasColors.warning,
            ),
            const SizedBox(height: 10),
            Text(
              'Camera Access Required',
              style: GoogleFonts.plusJakartaSans(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              error.errorDetails?.message ??
                  'Please grant camera permission to scan QR codes.',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                color: SasColors.textMuted,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 14),
            GlassButton(label: 'Start Camera', height: 38, onPressed: onRetry),
          ],
        ),
      ),
    );
  }
}
