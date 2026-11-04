import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_camera_tips_card.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';

class VerificationCameraFrame extends StatelessWidget {
  final CameraController? camera;
  final bool isCameraReady;
  final String? cameraError;
  final bool showTips;
  final VoidCallback onDismissTips;
  final VoidCallback onRetryCamera;

  const VerificationCameraFrame({
    super.key,
    required this.camera,
    required this.isCameraReady,
    required this.cameraError,
    required this.showTips,
    required this.onDismissTips,
    required this.onRetryCamera,
  });

  @override
  Widget build(BuildContext context) {
    if (showTips) {
      return Expanded(
        child: Center(
          child: VerificationCameraTipsCard(onDismissTips: onDismissTips),
        ),
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? SasColors.darkBorder
        : SasColors.border;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;

    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderCol),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: cameraError != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.camera_alt_outlined,
                          color: SasColors.danger,
                          size: 48,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          cameraError!,
                          textAlign: TextAlign.center,
                          style: SasTypography.style(
                            color: SasColors.danger,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (cameraError!.toLowerCase().contains(
                                  'permission',
                                ) ||
                                cameraError!.toLowerCase().contains(
                                  'denied',
                                )) ...[
                              AppButton(
                                label: 'Open Settings',
                                icon: Icons.settings_rounded,
                                onPressed: () => Geolocator.openAppSettings(),
                              ),
                              const SizedBox(width: 8),
                            ],
                            AppButton(
                              label: 'Retry Camera',
                              icon: Icons.refresh_rounded,
                              onPressed: onRetryCamera,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )
              : isCameraReady && camera != null
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    CameraPreview(camera!),
                    Center(
                      child: Container(
                        width: 220,
                        height: 290,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(110),
                          border: Border.all(
                            color: SasColors.copper,
                            width: 2.5,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 20,
                      left: 16,
                      right: 16,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color:
                                (isDark
                                        ? SasColors.ink
                                        : Colors.white)
                                    .withValues(alpha: 0.90),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderCol),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.face_retouching_natural_rounded,
                                color: SasColors.copper,
                                size: 19,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Position face inside oval frame',
                                style: SasTypography.style(
                                  color: primaryTextColor,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              : const Center(
                  child: CircularProgressIndicator(color: SasColors.copper),
                ),
        ),
      ),
    );
  }
}
