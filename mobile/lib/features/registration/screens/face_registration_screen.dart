import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/registration/providers/registration_provider.dart';
import 'package:smart_attendance_app/features/registration/widgets/face_camera_preview.dart';
import 'package:smart_attendance_app/features/registration/widgets/face_registration_bottom_bar.dart';
import 'package:smart_attendance_app/utils/logger.dart';

class FaceRegistrationScreen extends ConsumerStatefulWidget {
  const FaceRegistrationScreen({super.key});

  @override
  ConsumerState<FaceRegistrationScreen> createState() =>
      _FaceRegistrationScreenState();
}

class _FaceRegistrationScreenState
    extends ConsumerState<FaceRegistrationScreen> {
  CameraController? _cameraController;
  bool _isCameraReady = false;
  String? _capturedPath;
  String? _cameraError;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _cameraError = 'No cameras detected on this device');
        return;
      }
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _cameraController = CameraController(
        front,
        ResolutionPreset.high,
        enableAudio: false,
      );
      await _cameraController!.initialize();
      if (mounted) setState(() => _isCameraReady = true);
    } catch (e) {
      AppLogger.error('Camera initialization failed: $e');
      if (mounted) {
        setState(() => _cameraError = 'Camera initialization failed: $e');
      }
    }
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    try {
      final file = await _cameraController!.takePicture();
      setState(() => _capturedPath = file.path);
    } catch (e) {
      AppLogger.error('Capture failed: $e');
    }
  }

  Future<void> _uploadPhoto() async {
    if (_capturedPath == null) return;
    final success = await ref
        .read(registrationProvider.notifier)
        .uploadFace(_capturedPath!);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Biometric profile enrolled successfully!'),
          backgroundColor: Color(0xFF08A875),
        ),
      );
      await Future.delayed(const Duration(milliseconds: 600));
      if (mounted) ref.read(authProvider.notifier).onFaceRegistered();
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final regState = ref.watch(registrationProvider);
    final isUploading = regState.status == RegistrationStatus.uploading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(
                    0xFFF95721,
                  ).withValues(alpha: isDark ? 0.2 : 0.12),
                ),
                child: const Icon(
                  Icons.face_retouching_natural_rounded,
                  color: Color(0xFFF95721),
                  size: 28,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Biometric Enrollment',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Align your face within the oval guide to create your official verification template.',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  color: isDark
                      ? const Color(0xFF94A3B8)
                      : const Color(0xFF64748B),
                  fontSize: 12.5,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: FaceCameraPreview(
                  capturedPath: _capturedPath,
                  cameraError: _cameraError,
                  isCameraReady: _isCameraReady,
                  cameraController: _cameraController,
                  onRetry: () {
                    setState(() {
                      _cameraError = null;
                      _isCameraReady = false;
                    });
                    _initCamera();
                  },
                ),
              ),
              const SizedBox(height: 14),
              if (regState.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    regState.errorMessage!,
                    style: GoogleFonts.plusJakartaSans(
                      color: const Color(0xFFF0445E),
                      fontSize: 12,
                    ),
                  ),
                ),
              FaceRegistrationBottomBar(
                capturedPath: _capturedPath,
                isCameraReady: _isCameraReady,
                isUploading: isUploading,
                onCapture: _capturePhoto,
                onRetake: () => setState(() => _capturedPath = null),
                onUpload: _uploadPhoto,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
