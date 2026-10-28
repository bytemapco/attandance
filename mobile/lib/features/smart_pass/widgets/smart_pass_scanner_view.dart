import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/scanner_reticle_overlay.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_camera_error.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_telemetry_pills.dart';

/// Enterprise camera viewfinder for Smart Pass QR scanning.
class SmartPassScannerView extends StatelessWidget {
  final MobileScannerController controller;
  final bool isLoading;
  final bool isProcessing;
  final void Function(BarcodeCapture) onDetect;

  const SmartPassScannerView({
    super.key,
    required this.controller,
    required this.isLoading,
    required this.isProcessing,
    required this.onDetect,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderColor = isDark ? const Color(0x1EFFFFFF) : const Color(0x140F172A);

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
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildCameraViewport(context),
          const SizedBox(height: 14),
          Text(
            'Scan Classroom QR',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: SasColors.textPrimaryOf(context),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Align the instructor's code inside the frame to check in.",
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: SasColors.textMutedOf(context),
            ),
          ),
          const SizedBox(height: 12),
          const SmartPassTelemetryPills(),
        ],
      ),
    );
  }

  Widget _buildCameraViewport(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Container(
        height: 310,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            MobileScanner(
              controller: controller,
              onDetect: onDetect,
              errorBuilder: (context, error) => SmartPassCameraError(
                error: error,
                onRetry: () => controller.start(),
              ),
            ),
            const ScannerReticleOverlay(guideColor: Color(0xFFF95721)),
            Positioned(
              top: 12,
              right: 12,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ValueListenableBuilder(
                    valueListenable: controller,
                    builder: (context, state, child) {
                      final isTorchOn = state.torchState == TorchState.on;
                      return _buildIconButton(
                        icon: isTorchOn
                            ? Icons.flash_on_rounded
                            : Icons.flash_off_rounded,
                        isActive: isTorchOn,
                        onPressed: () => controller.toggleTorch(),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  _buildIconButton(
                    icon: Icons.flip_camera_ios_rounded,
                    isActive: false,
                    onPressed: () => controller.switchCamera(),
                  ),
                ],
              ),
            ),
            if (isLoading || isProcessing) _buildVerifyingOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required bool isActive,
    required VoidCallback onPressed,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isActive
                  ? const Color(0xFFF95721).withValues(alpha: 0.85)
                  : Colors.black.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isActive
                    ? const Color(0xFFF95721)
                    : Colors.white.withValues(alpha: 0.2),
              ),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
        ),
      ),
    );
  }

  Widget _buildVerifyingOverlay() {
    return Container(
      color: Colors.black.withValues(alpha: 0.72),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 36,
              height: 36,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: Color(0xFFF95721),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Verifying Pass...',
              style: GoogleFonts.plusJakartaSans(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
