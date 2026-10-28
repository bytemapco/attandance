import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_camera_tips_card.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

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
      return VerificationCameraTipsCard(onDismissTips: onDismissTips);
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE3E9F1);
    final primaryTextColor = isDark ? SasColors.brilliance : const Color(0xFF0F172A);

    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: borderCol),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: cameraError != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.camera_alt_outlined, color: SasColors.danger, size: 48),
                        const SizedBox(height: 12),
                        Text(
                          cameraError!,
                          textAlign: TextAlign.center,
                          style: SasTypography.style(color: SasColors.danger, fontSize: 13),
                        ),
                        const SizedBox(height: 16),
                        GlassButton(
                          label: 'Retry Camera',
                          icon: Icons.refresh_rounded,
                          onPressed: onRetryCamera,
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
                                color: const Color(0xFFF95721),
                                width: 2.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFF95721).withValues(alpha: 0.22),
                                  blurRadius: 16,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 20,
                          left: 16,
                          right: 16,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: (isDark ? const Color(0xFF0F172A) : Colors.white).withValues(alpha: 0.90),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: borderCol),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.12),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.face_retouching_natural_rounded,
                                    color: Color(0xFFF95721),
                                    size: 19,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Position face inside oval frame',
                                    style: SasTypography.style(
                                      color: primaryTextColor,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
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
                      child: CircularProgressIndicator(color: Color(0xFFF95721)),
                    ),
        ),
      ),
    );
  }
}
