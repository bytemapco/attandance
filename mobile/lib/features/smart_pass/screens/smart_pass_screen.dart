import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smart_attendance_app/data/local/permission_service.dart';
import 'package:smart_attendance_app/features/smart_pass/providers/smart_pass_provider.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_error_banner.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_guidelines_card.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_permission_card.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_scanner_view.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_success_card.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';

class SmartPassScreen extends ConsumerStatefulWidget {
  const SmartPassScreen({super.key});

  @override
  ConsumerState<SmartPassScreen> createState() => _SmartPassScreenState();
}

class _SmartPassScreenState extends ConsumerState<SmartPassScreen>
    with WidgetsBindingObserver {
  PermissionStatusResult? _permissionStatus;
  bool _checkingPermission = false;
  bool _isProcessing = false;
  late final MobileScannerController _scannerController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _checkPermissions();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scannerController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkPermissions();
    }
  }

  Future<void> _checkPermissions() async {
    setState(() => _checkingPermission = true);
    final status = await ref
        .read(permissionServiceProvider)
        .checkAttendancePermissions();
    if (mounted) {
      setState(() {
        _permissionStatus = status;
        _checkingPermission = false;
      });
    }
  }

  Future<void> _requestPermissions() async {
    final status = await ref
        .read(permissionServiceProvider)
        .requestLocationPermission();
    if (mounted) {
      setState(() => _permissionStatus = status);
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final passState = ref.read(smartPassProvider);
    if (passState.isLoading || passState.scanResult != null) return;

    for (final barcode in capture.barcodes) {
      final code = barcode.rawValue?.trim();
      if (code != null && code.isNotEmpty) {
        _scannerController.stop();
        setState(() => _isProcessing = true);
        HapticFeedback.mediumImpact();
        ref
            .read(smartPassProvider.notifier)
            .scanAndVerifyPass(code)
            .whenComplete(() {
              if (mounted) {
                setState(() => _isProcessing = false);
                if (ref.read(smartPassProvider).scanResult == null) {
                  _scannerController.start();
                }
              }
            });
        break;
      }
    }
  }

  void _handleBack() {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final passState = ref.watch(smartPassProvider);
    final hasPermission = _checkingPermission
        ? false
        : (_permissionStatus?.hasLocationAccess ?? false);
    final isLocationServiceOn = _checkingPermission
        ? false
        : (_permissionStatus?.isLocationServiceEnabled ?? false);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: GlassAppBar(
          title: 'Smart Pass Scanner',
          showBack: true,
          onBackPressed: _handleBack,
        ),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: ListView(
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                children: [
                  if (passState.scanResult != null)
                    SmartPassSuccessCard(
                      result: passState.scanResult!,
                      onScanAnother: () {
                        setState(() => _isProcessing = false);
                        ref.read(smartPassProvider.notifier).resetScan();
                        _scannerController.start();
                      },
                    )
                  else if (!hasPermission || !isLocationServiceOn)
                    SmartPassPermissionCard(
                      permissionStatus: _permissionStatus,
                      isChecking: _checkingPermission,
                      onRequestPermissions: _requestPermissions,
                    )
                  else ...[
                    SmartPassScannerView(
                      controller: _scannerController,
                      isLoading: passState.isLoading,
                      isProcessing: _isProcessing,
                      onDetect: _onDetect,
                    ),
                    const SizedBox(height: 14),
                    if (passState.errorMessage != null)
                      SmartPassErrorBanner(error: passState.errorMessage!),
                  ],
                  const SizedBox(height: 14),
                  const SmartPassGuidelinesCard(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
