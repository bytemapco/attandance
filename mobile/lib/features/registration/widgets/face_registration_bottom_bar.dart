import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FaceRegistrationBottomBar extends StatelessWidget {
  final String? capturedPath;
  final bool isCameraReady;
  final bool isUploading;
  final VoidCallback onCapture;
  final VoidCallback onRetake;
  final VoidCallback onUpload;

  const FaceRegistrationBottomBar({
    super.key,
    required this.capturedPath,
    required this.isCameraReady,
    required this.isUploading,
    required this.onCapture,
    required this.onRetake,
    required this.onUpload,
  });

  @override
  Widget build(BuildContext context) {
    if (capturedPath == null) {
      return _buildButton(
        context: context,
        label: 'Capture Photo',
        icon: Icons.camera_alt_rounded,
        isPrimary: true,
        onPressed: isCameraReady ? onCapture : null,
      );
    }

    return Row(
      children: [
        Expanded(
          child: _buildButton(
            context: context,
            label: 'Retake',
            icon: Icons.refresh_rounded,
            isPrimary: false,
            onPressed: isUploading ? null : onRetake,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildButton(
            context: context,
            label: 'Save & Enroll',
            icon: Icons.cloud_upload_rounded,
            isPrimary: true,
            isLoading: isUploading,
            onPressed: isUploading ? null : onUpload,
          ),
        ),
      ],
    );
  }

  Widget _buildButton({
    required BuildContext context,
    required String label,
    required IconData icon,
    required bool isPrimary,
    bool isLoading = false,
    VoidCallback? onPressed,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (isPrimary) {
      return SizedBox(
        height: 52,
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: onPressed,
          icon: isLoading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Icon(icon, size: 20, color: Colors.white),
          label: Text(
            isLoading ? 'Uploading...' : label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFF95721),
            elevation: 1.5,
            shadowColor: const Color(0xFFF95721).withValues(alpha: 0.35),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      );
    }

    return SizedBox(
      height: 52,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(
          icon,
          size: 20,
          color: isDark ? Colors.white : const Color(0xFF0F172A),
        ),
        label: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
            width: 1.2,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}
