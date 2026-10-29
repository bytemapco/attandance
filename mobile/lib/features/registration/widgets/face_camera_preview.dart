import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(23),
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
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(
                            0xFFF0445E,
                          ).withValues(alpha: 0.12),
                        ),
                        child: const Icon(
                          Icons.videocam_off_rounded,
                          color: Color(0xFFF0445E),
                          size: 36,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        cameraError!,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFFF0445E),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: onRetry,
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: Text(
                          'Retry Camera',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
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
                      width: 210,
                      height: 275,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(105),
                        border: Border.all(
                          color: const Color(0xFFF95721).withValues(alpha: 0.8),
                          width: 2.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(
                              0xFFF95721,
                            ).withValues(alpha: 0.2),
                            blurRadius: 12,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Fit face in oval',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
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
    );
  }
}
