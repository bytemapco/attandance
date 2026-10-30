import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/preferences_service.dart';
import 'package:smart_attendance_app/data/repositories/config_repository.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_camera_mixin.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_flow_mixin.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_app_bar.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_body_view.dart';

class VerificationScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const VerificationScreen({super.key, required this.sessionId});

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen>
    with
        WidgetsBindingObserver,
        VerificationCameraMixin<VerificationScreen>,
        VerificationFlowMixin {
  bool _showTips = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkFirstUse();
    Future.microtask(() {
      if (!mounted) return;
      ref.read(configRepositoryProvider).fetchAndCacheConfig();
      handleLocationVerify();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    clearTimers();
    disposeCamera();
    super.dispose();
  }

  Future<void> _checkFirstUse() async {
    final prefs = ref.read(preferencesServiceProvider);
    if (await prefs.isFirstCameraUse() && mounted) {
      setState(() => _showTips = true);
      await prefs.markCameraUsed();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) return;
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      setState(() => isCameraReady = false);
      disposeCamera();
    } else if (state == AppLifecycleState.resumed &&
        ref.read(attendanceVerificationProvider).step ==
            VerificationStep.camera) {
      initCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    final vState = ref.watch(attendanceVerificationProvider);
    final geoState = ref.watch(geofenceVerificationProvider);

    ref.listen<AttendanceVerificationState>(attendanceVerificationProvider, (
      prev,
      next,
    ) {
      if (next.step == VerificationStep.reviewing) aiStepTimer?.cancel();
      if (next.step == VerificationStep.done &&
          prev?.step != VerificationStep.done) {
        onDone();
      }
    });

    ref.listen<GeofenceVerificationState>(geofenceVerificationProvider, (
      prev,
      next,
    ) {
      if (vState.step == VerificationStep.gps &&
          next.status == GeofenceStatus.success &&
          prev?.status != GeofenceStatus.success) {
        onGpsSuccess(next);
      }
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) return;
        clearTimers();
        disposeCamera();
        if (vState.step != VerificationStep.done) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref.read(attendanceVerificationProvider.notifier).reset();
          });
        }
      },
      child: Scaffold(
        backgroundColor: isDark
            ? SasColors.darkCanvas
            : const Color(0xFFF4F7FB),
        appBar: const VerificationAppBar(),
        body: VerificationBodyView(
          vState: vState,
          geoState: geoState,
          onRetryGeo: handleLocationVerify,
          camera: camera,
          isCameraReady: isCameraReady,
          cameraError: cameraError,
          showTips: _showTips,
          onDismissTips: () => setState(() => _showTips = false),
          onRetryCamera: () {
            setState(() {
              cameraError = null;
              isCameraReady = false;
            });
            initCamera();
          },
          isAnalyzingQuality: isAnalyzingQuality,
          brightnessScore: brightnessScore,
          blurScore: blurScore,
          aiStepIndex: aiStepIndex,
          aiSteps: VerificationFlowMixin.aiSteps,
          onCapture: capturePhoto,
          onRetake: retakePhoto,
          onAnalyze: analyzePhoto,
          onSubmit: () => ref
              .read(attendanceVerificationProvider.notifier)
              .confirm(widget.sessionId),
        ),
      ),
    );

  }
}
