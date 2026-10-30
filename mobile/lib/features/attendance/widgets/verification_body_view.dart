import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_step_bottom_bar.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_step_content.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_step_indicator.dart';

class VerificationBodyView extends StatelessWidget {
  final AttendanceVerificationState vState;
  final GeofenceVerificationState geoState;
  final VoidCallback onRetryGeo;
  final CameraController? camera;
  final bool isCameraReady;
  final String? cameraError;
  final bool showTips;
  final VoidCallback onDismissTips;
  final VoidCallback onRetryCamera;
  final bool isAnalyzingQuality;
  final double? brightnessScore;
  final double? blurScore;
  final int aiStepIndex;
  final List<String> aiSteps;
  final VoidCallback onCapture;
  final VoidCallback onRetake;
  final VoidCallback onAnalyze;
  final VoidCallback onSubmit;

  const VerificationBodyView({
    super.key,
    required this.vState,
    required this.geoState,
    required this.onRetryGeo,
    required this.camera,
    required this.isCameraReady,
    required this.cameraError,
    required this.showTips,
    required this.onDismissTips,
    required this.onRetryCamera,
    required this.isAnalyzingQuality,
    required this.brightnessScore,
    required this.blurScore,
    required this.aiStepIndex,
    required this.aiSteps,
    required this.onCapture,
    required this.onRetake,
    required this.onAnalyze,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Column(
          children: [
            VerificationStepIndicator(current: vState.step),
            const SizedBox(height: 20),
            VerificationStepContent(
              step: vState.step,
              geoState: geoState,
              onRetryGeo: onRetryGeo,
              camera: camera,
              isCameraReady: isCameraReady,
              cameraError: cameraError,
              showTips: showTips,
              onDismissTips: onDismissTips,
              onRetryCamera: onRetryCamera,
              imagePath: vState.imagePath,
              isAnalyzingQuality: isAnalyzingQuality,
              brightnessScore: brightnessScore,
              blurScore: blurScore,
              aiStepIndex: aiStepIndex,
              aiSteps: aiSteps,
              analysisResult: vState.analysisResult,
            ),
            VerificationStepBottomBar(
              step: vState.step,
              showTips: showTips,
              isCameraReady: isCameraReady,
              onCapture: onCapture,
              onRetake: onRetake,
              onAnalyze: onAnalyze,
              onSubmit: onSubmit,
            ),
          ],
        ),
      ),
    );
  }
}
