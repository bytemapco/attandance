import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/preferences_service.dart';
import 'package:smart_attendance_app/data/repositories/config_repository.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/providers/geofence_verification_provider.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_camera_mixin.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_app_bar.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_step_bottom_bar.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_step_content.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_step_indicator.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';

class VerificationScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const VerificationScreen({super.key, required this.sessionId});

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen>
    with WidgetsBindingObserver, VerificationCameraMixin<VerificationScreen> {
  int _aiStepIndex = 0;
  Timer? _aiStepTimer;
  Timer? _transitionTimer;
  bool _showTips = false;

  static const _aiSteps = ['Checking face identity...', 'Verifying liveness...', 'Analyzing background...', 'Computing final score...'];

  void _clearTimers() {
    _aiStepTimer?.cancel();
    _transitionTimer?.cancel();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkFirstUse();
    Future.microtask(() {
      if (!mounted) return;
      ref.read(configRepositoryProvider).fetchAndCacheConfig();
      _handleLocationVerify();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _clearTimers();
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
    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      setState(() => isCameraReady = false);
      disposeCamera();
    } else if (state == AppLifecycleState.resumed &&
        ref.read(attendanceVerificationProvider).step == VerificationStep.camera) {
      initCamera();
    }
  }

  Future<void> _analyzePhoto() async {
    _aiStepIndex = 0;
    _aiStepTimer?.cancel();
    _aiStepTimer = Timer.periodic(const Duration(milliseconds: 1200), (t) {
      if (mounted && _aiStepIndex < _aiSteps.length - 1) {
        setState(() => _aiStepIndex++);
      } else {
        t.cancel();
      }
    });
    await ref.read(attendanceVerificationProvider.notifier).analyze(widget.sessionId);
  }

  void _retakePhoto() {
    disposeCamera();
    if (mounted) setState(() { cameraError = null; isCameraReady = false; });
    ref.read(attendanceVerificationProvider.notifier).reset();
    ref.read(geofenceVerificationProvider.notifier).reset();
    initCamera();
  }

  void _handleLocationVerify() {
    if (!mounted) return;
    final session = ref.read(sessionProvider).sessions.where((s) => s.sessionId == widget.sessionId).firstOrNull;
    if (session?.latitude != null && session?.longitude != null) {
      ref.read(geofenceVerificationProvider.notifier).verifyLocation(
        classLat: session!.latitude!,
        classLng: session.longitude!,
        radius: session.radiusMeters ?? 100.0,
      );
    }
  }

  void _onGpsSuccess(GeofenceVerificationState next) {
    _transitionTimer?.cancel();
    _transitionTimer = Timer(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      final config = ref.read(hiveServiceProvider).getSystemConfig();
      ref.read(attendanceVerificationProvider.notifier).setGpsLocation(
        next.position!.latitude, next.position!.longitude, next.position!.accuracy,
      );
      if (config.isFaceRecognitionEnabled || config.isAiBackgroundValidationEnabled) {
        initCamera();
      } else {
        ref.read(attendanceVerificationProvider.notifier).setImagePath('skipped_camera.jpg');
        _analyzePhoto();
      }
    });
  }

  void _onDone() {
    _clearTimers();
    disposeCamera();
    final id = ref.read(attendanceVerificationProvider.notifier).lastSubmittedSessionId;
    if (id != null) ref.read(sessionProvider.notifier).markSessionSubmitted(id);
    if (mounted) context.pushReplacement('/result');
  }

  @override
  Widget build(BuildContext context) {
    final vState = ref.watch(attendanceVerificationProvider);
    final geoState = ref.watch(geofenceVerificationProvider);

    ref.listen<AttendanceVerificationState>(attendanceVerificationProvider, (prev, next) {
      if (next.step == VerificationStep.reviewing) _aiStepTimer?.cancel();
      if (next.step == VerificationStep.done && prev?.step != VerificationStep.done) _onDone();
    });

    ref.listen<GeofenceVerificationState>(geofenceVerificationProvider, (prev, next) {
      if (vState.step == VerificationStep.gps && next.status == GeofenceStatus.success && prev?.status != GeofenceStatus.success) {
        _onGpsSuccess(next);
      }
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        _clearTimers();
        disposeCamera();
        ref.read(attendanceVerificationProvider.notifier).reset();
      },
      child: Scaffold(
        backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
        appBar: const VerificationAppBar(),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Column(
              children: [
                VerificationStepIndicator(current: vState.step),
                const SizedBox(height: 20),
                VerificationStepContent(
                  step: vState.step, geoState: geoState, onRetryGeo: _handleLocationVerify,
                  camera: camera, isCameraReady: isCameraReady, cameraError: cameraError,
                  showTips: _showTips, onDismissTips: () => setState(() => _showTips = false),
                  onRetryCamera: () { setState(() { cameraError = null; isCameraReady = false; }); initCamera(); },
                  imagePath: vState.imagePath, isAnalyzingQuality: isAnalyzingQuality,
                  brightnessScore: brightnessScore, blurScore: blurScore,
                  aiStepIndex: _aiStepIndex, aiSteps: _aiSteps, analysisResult: vState.analysisResult,
                ),
                VerificationStepBottomBar(
                  step: vState.step, showTips: _showTips, isCameraReady: isCameraReady,
                  onCapture: capturePhoto, onRetake: _retakePhoto, onAnalyze: _analyzePhoto,
                  onSubmit: () => ref.read(attendanceVerificationProvider.notifier).confirm(widget.sessionId),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
