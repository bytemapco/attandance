import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_camera_mixin.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_screen.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';

mixin VerificationFlowMixin
    on
        ConsumerState<VerificationScreen>,
        VerificationCameraMixin<VerificationScreen> {
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
    aiStepTimer = null;
    transitionTimer?.cancel();
    transitionTimer = null;
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
    try {
      await ref
          .read(attendanceVerificationProvider.notifier)
          .analyze(widget.sessionId);
    } finally {
      aiStepTimer?.cancel();
    }
  }

  /// Saves the reviewed mark. The class name and window close time travel with it, so a mark
  /// queued while offline can be explained to the student and dropped if the window closes first.
  Future<void> confirmAttendance() {
    final session = ref
        .read(sessionProvider)
        .sessions
        .where((s) => s.sessionId == widget.sessionId)
        .firstOrNull;
    return ref
        .read(attendanceVerificationProvider.notifier)
        .confirm(
          widget.sessionId,
          className: session?.subject,
          windowClosesAt: session?.sessionEndTime,
        );
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
    ref
        .read(geofenceVerificationProvider.notifier)
        .verifyLocation(
          classLat: session?.latitude,
          classLng: session?.longitude,
          radius: session?.radiusMeters,
        );
  }

  /// Location is settled (checked, or not configured and flagged). Continue to the selfie.
  void onLocationSettled(GeofenceVerificationState next) {
    final position = next.position;
    if (position == null) return;
    transitionTimer?.cancel();
    transitionTimer = Timer(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      ref
          .read(attendanceVerificationProvider.notifier)
          .setGpsLocation(
            position.latitude,
            position.longitude,
            position.accuracy,
          );
      initCamera();
    });
  }

  void onDone() {
    clearTimers();
    disposeCamera();
    final id = ref
        .read(attendanceVerificationProvider.notifier)
        .lastSubmittedSessionId;
    if (id != null) ref.read(sessionProvider.notifier).markSessionSubmitted(id);
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.pushReplacement('/result');
    });
  }
}
