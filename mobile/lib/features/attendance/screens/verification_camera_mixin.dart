import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/utils/image_quality.dart';
import 'package:smart_attendance_app/utils/logger.dart';

mixin VerificationCameraMixin<T extends ConsumerStatefulWidget> on ConsumerState<T> {
  CameraController? camera;
  bool isCameraReady = false;
  String? cameraError;
  bool isAnalyzingQuality = false;
  double? brightnessScore;
  double? blurScore;
  bool _isInitializing = false;

  Future<void> initCamera() async {
    if (_isInitializing || (camera != null && camera!.value.isInitialized)) return;
    _isInitializing = true;
    try {
      camera?.dispose().catchError((e) => null);
      camera = null;
      if (!mounted) return;
      final cameras = await availableCameras();
      if (!mounted || cameras.isEmpty) {
        setState(() => cameraError = 'No cameras found');
        return;
      }
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      final ctrl = CameraController(front, ResolutionPreset.high, enableAudio: false);
      camera = ctrl;
      await ctrl.initialize();
      if (mounted && camera == ctrl) {
        setState(() { isCameraReady = true; cameraError = null; });
      } else {
        await ctrl.dispose().catchError((e) => null);
      }
    } catch (e) {
      if (mounted) setState(() => cameraError = 'Camera initialization failed');
    } finally {
      _isInitializing = false;
    }
  }

  Future<void> capturePhoto() async {
    if (camera == null || !camera!.value.isInitialized) return;
    try {
      final file = await camera!.takePicture();
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      ref.read(attendanceVerificationProvider.notifier).setImagePath(file.path);
      setState(() {
        isAnalyzingQuality = true;
        brightnessScore = null;
        blurScore = null;
      });
      disposeCamera();
      compute(computeImageQuality, file.path).then((q) {
        if (mounted) {
          setState(() {
            brightnessScore = q.brightness;
            blurScore = q.blur;
            isAnalyzingQuality = false;
          });
        }
      });
    } catch (e) {
      AppLogger.error('Capture: $e');
    }
  }

  void disposeCamera() {
    final ctrl = camera;
    camera = null;
    isCameraReady = false;
    ctrl?.dispose().catchError((_) {});
  }
}
