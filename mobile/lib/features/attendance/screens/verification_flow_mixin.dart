import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_camera_mixin.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_screen.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';

mixin VerificationFlowMixin on ConsumerState<VerificationScreen>, VerificationCameraMixin<VerificationScreen> {
  int aiStepIndex = 0;
  Timer? aiStepTimer;
  Timer? transitionTimer;

  static const aiSteps = [
    'Checking face identity...',
    'Verifying liveness...',
    'Analyzing background...',
    'Computing final score...',
  ];

  void clearTimers() {
    aiStepTimer?.cancel();
    transitionTimer?.cancel();
  }

  Future<void> analyzePhoto() async {
    aiStepIndex = 0;
    aiStepTimer?.cancel();
    aiStepTimer = Timer.periodic(const Duration(milliseconds: 1200), (t) {
      if (mounted && aiStepIndex < aiSteps.length - 1) {
        setState(() => aiStepIndex++);
      } else {
        t.cancel();
      }
    });
    await ref
        .read(attendanceVerificationProvider.notifier)
        .analyze(widget.sessionId);
  }

  void retakePhoto() {
    disposeCamera();
    if (mounted) {
      setState(() {
        cameraError = null;
        isCameraReady = false;
      });
    }
    ref.read(attendanceVerificationProvider.notifier).reset();
    ref.read(geofenceVerificationProvider.notifier).reset();
    initCamera();
  }

  void handleLocationVerify() {
    if (!mounted) return;
    final session = ref
        .read(sessionProvider)
        .sessions
        .where((s) => s.sessionId == widget.sessionId)
        .firstOrNull;
    if (session?.latitude != null && session?.longitude != null) {
      ref
          .read(geofenceVerificationProvider.notifier)
          .verifyLocation(
            classLat: session!.latitude!,
            classLng: session.longitude!,
            radius: session.radiusMeters ?? 100.0,
          );
    }
  }

  void onGpsSuccess(GeofenceVerificationState next) {
    transitionTimer?.cancel();
    transitionTimer = Timer(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      final config = ref.read(hiveServiceProvider).getSystemConfig();
      ref
          .read(attendanceVerificationProvider.notifier)
          .setGpsLocation(
            next.position!.latitude,
            next.position!.longitude,
            next.position!.accuracy,
          );
      if (config.isFaceRecognitionEnabled ||
          config.isAiBackgroundValidationEnabled) {
        initCamera();
      } else {
        ref
            .read(attendanceVerificationProvider.notifier)
            .setImagePath('skipped_camera.jpg');
        analyzePhoto();
      }
    });
  }

  void onDone() {
    clearTimers();
    disposeCamera();
    final id = ref
        .read(attendanceVerificationProvider.notifier)
        .lastSubmittedSessionId;
    if (id != null) ref.read(sessionProvider.notifier).markSessionSubmitted(id);
    if (mounted) context.pushReplacement('/result');
  }
}
