import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class FaceCameraPreview extends StatelessWidget {
  final String? capturedPath;
  final String? cameraError;
  final bool isCameraReady;
  final CameraController? cameraController;
  final VoidCallback onRetry;

  const FaceCameraPreview({
    super.key,
    required this.capturedPath,
    required this.cameraError,
    required this.isCameraReady,
    required this.cameraController,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: capturedPath != null
            ? Image.file(
                File(capturedPath!),
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
              )
            : cameraError != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.camera_alt_outlined, color: SasColors.danger, size: 40),
                          const SizedBox(height: 10),
                          Text(cameraError!, textAlign: TextAlign.center, style: const TextStyle(color: SasColors.danger, fontSize: 13)),
                          const SizedBox(height: 14),
                          GlassButton(label: 'Retry Camera', icon: Icons.refresh_rounded, onPressed: onRetry),
                        ],
                      ),
                    ),
                  )
                : isCameraReady && cameraController != null
                    ? Stack(
                        fit: StackFit.expand,
                        children: [
                          CameraPreview(cameraController!),
                          Center(
                            child: Container(
                              width: 200,
                              height: 260,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(100),
                                border: Border.all(color: SasColors.accentEmerald.withValues(alpha: 0.6), width: 2),
                              ),
                            ),
                          ),
                        ],
                      )
                    : const Center(child: CircularProgressIndicator(color: SasColors.accentEmerald)),
      ),
    );
  }
}
