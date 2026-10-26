import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/registration/providers/registration_provider.dart';
import 'package:smart_attendance_app/features/registration/widgets/face_camera_preview.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/utils/logger.dart';

class FaceRegistrationScreen extends ConsumerStatefulWidget {
  const FaceRegistrationScreen({super.key});

  @override
  ConsumerState<FaceRegistrationScreen> createState() => _FaceRegistrationScreenState();
}

class _FaceRegistrationScreenState extends ConsumerState<FaceRegistrationScreen> {
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
      final front = cameras.firstWhere((c) => c.lensDirection == CameraLensDirection.front, orElse: () => cameras.first);
      _cameraController = CameraController(front, ResolutionPreset.high, enableAudio: false);
      await _cameraController!.initialize();
      if (mounted) setState(() => _isCameraReady = true);
    } catch (e) {
      AppLogger.error('Camera initialization failed: $e');
      if (mounted) setState(() => _cameraError = 'Camera initialization failed: $e');
    }
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;
    try {
      final file = await _cameraController!.takePicture();
      setState(() => _capturedPath = file.path);
    } catch (e) {
      AppLogger.error('Capture failed: $e');
    }
  }

  Future<void> _uploadPhoto() async {
    if (_capturedPath == null) return;
    final success = await ref.read(registrationProvider.notifier).uploadFace(_capturedPath!);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Biometric profile enrolled successfully!'), backgroundColor: SasColors.accentEmerald),
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

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const SizedBox(height: 12),
                const Icon(Icons.face_retouching_natural_rounded, color: SasColors.accentEmerald, size: 36),
                const SizedBox(height: 8),
                const Text('Biometric Enrollment', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: SasColors.textPrimary)),
                const SizedBox(height: 4),
                const Text(
                  'Align your face within the frame. This creates your official biometric template.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: SasColors.textMuted, fontSize: 12),
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
                    child: Text(regState.errorMessage!, style: const TextStyle(color: SasColors.danger, fontSize: 12)),
                  ),
                if (_capturedPath == null)
                  GlassButton(
                    label: 'Capture Photo',
                    isExpanded: true,
                    icon: Icons.camera_alt_rounded,
                    onPressed: _isCameraReady ? _capturePhoto : null,
                  )
                else
                  Row(
                    children: [
                      Expanded(
                        child: GlassButton(
                          label: 'Retake',
                          variant: GlassButtonVariant.secondary,
                          icon: Icons.refresh_rounded,
                          onPressed: isUploading ? null : () => setState(() => _capturedPath = null),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GlassButton(
                          label: 'Save & Enroll',
                          isLoading: isUploading,
                          icon: Icons.cloud_upload_rounded,
                          onPressed: isUploading ? null : _uploadPhoto,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
