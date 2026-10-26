import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

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
      return GlassCard(
        borderColor: SasColors.accentEmerald.withValues(alpha: 0.4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.tips_and_updates_rounded, color: SasColors.accentEmerald, size: 18),
                SizedBox(width: 8),
                Text('Tips for best results',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              '• Look straight at the camera\n'
              '• Ensure good lighting (avoid backlighting)\n'
              '• Remove glasses if possible\n'
              '• Keep your full face inside the oval',
              style: TextStyle(color: SasColors.textSecondary, fontSize: 13, height: 1.6),
            ),
            const SizedBox(height: 8),
            GlassButton(
              label: 'Got it',
              variant: GlassButtonVariant.ghost,
              onPressed: onDismissTips,
            ),
          ],
        ),
      );
    }

    return Expanded(
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: cameraError != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.camera_alt_outlined, color: SasColors.danger, size: 48),
                      const SizedBox(height: 12),
                      Text(cameraError!, style: const TextStyle(color: SasColors.danger)),
                      const SizedBox(height: 16),
                      GlassButton(
                        label: 'Retry Camera',
                        icon: Icons.refresh_rounded,
                        onPressed: onRetryCamera,
                      ),
                    ],
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
                            height: 280,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(110),
                              border: Border.all(
                                color: SasColors.accentEmerald.withValues(alpha: 0.6),
                                width: 2,
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
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: SasColors.bgSecondary.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: SasColors.glassBorder, width: 1),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.face_retouching_natural_rounded,
                                      color: SasColors.accentEmerald, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Position face inside frame',
                                    style: TextStyle(
                                      color: SasColors.textPrimary,
                                      fontSize: 14,
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
                      child: CircularProgressIndicator(color: SasColors.accentEmerald),
                    ),
        ),
      ),
    );
  }
}
