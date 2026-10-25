import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/geofence_status_card.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_ai_review_card.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_camera_frame.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_preview_frame.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_status_overlay.dart';

class VerificationStepContent extends StatelessWidget {
  final VerificationStep step;
  final GeofenceVerificationState geoState;
  final VoidCallback onRetryGeo;
  final CameraController? camera;
  final bool isCameraReady;
  final String? cameraError;
  final bool showTips;
  final VoidCallback onDismissTips;
  final VoidCallback onRetryCamera;
  final String? imagePath;
  final bool isAnalyzingQuality;
  final double? brightnessScore;
  final double? blurScore;
  final int aiStepIndex;
  final List<String> aiSteps;
  final AttendanceAnalysisResult? analysisResult;

  const VerificationStepContent({
    super.key,
    required this.step,
    required this.geoState,
    required this.onRetryGeo,
    required this.camera,
    required this.isCameraReady,
    required this.cameraError,
    required this.showTips,
    required this.onDismissTips,
    required this.onRetryCamera,
    required this.imagePath,
    required this.isAnalyzingQuality,
    required this.brightnessScore,
    required this.blurScore,
    required this.aiStepIndex,
    required this.aiSteps,
    required this.analysisResult,
  });

  @override
  Widget build(BuildContext context) {
    if (step == VerificationStep.gps) {
      return Expanded(
        child: Column(
          children: [
            const Spacer(),
            GeofenceStatusCard(state: geoState, onRetry: onRetryGeo),
            const Spacer(),
          ],
        ),
      );
    }
    if (step == VerificationStep.camera) {
      return VerificationCameraFrame(
        camera: camera,
        isCameraReady: isCameraReady,
        cameraError: cameraError,
        showTips: showTips,
        onDismissTips: onDismissTips,
        onRetryCamera: onRetryCamera,
      );
    }
    if (step == VerificationStep.preview) {
      return Expanded(
        child: VerificationPreviewFrame(
          imagePath: imagePath,
          isAnalyzingQuality: isAnalyzingQuality,
          brightnessScore: brightnessScore,
          blurScore: blurScore,
        ),
      );
    }
    if (step == VerificationStep.submitting) {
      return Expanded(
        child: Column(
          children: [
            const Spacer(),
            VerificationStatusOverlay(
              title: 'Analyzing your submission…',
              activeStepIndex: aiStepIndex,
              stepLabels: aiSteps,
            ),
            const Spacer(),
          ],
        ),
      );
    }
    if (step == VerificationStep.reviewing && analysisResult != null) {
      return Expanded(
        child: Column(
          children: [
            const Spacer(),
            VerificationAiReviewCard(
              analysis: analysisResult!,
              imagePath: imagePath,
            ),
            const Spacer(),
          ],
        ),
      );
    }
    if (step == VerificationStep.confirming) {
      return const Expanded(
        child: Column(
          children: [
            Spacer(),
            VerificationStatusOverlay(
              title: 'Submitting attendance…',
              subtitle: 'Almost done',
            ),
            Spacer(),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }
}
