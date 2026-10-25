import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/permission_service.dart';
import 'package:smart_attendance_app/domain/models/smart_pass.dart';
import 'package:smart_attendance_app/features/smart_pass/providers/smart_pass_provider.dart';
import 'package:smart_attendance_app/features/smart_pass/widgets/smart_pass_guidelines_card.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SmartPassScreen extends ConsumerStatefulWidget {
  const SmartPassScreen({super.key});

  @override
  ConsumerState<SmartPassScreen> createState() => _SmartPassScreenState();
}

class _SmartPassScreenState extends ConsumerState<SmartPassScreen> with WidgetsBindingObserver {
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
    final status = await ref.read(permissionServiceProvider).checkAttendancePermissions();
    if (mounted) {
      setState(() {
        _permissionStatus = status;
        _checkingPermission = false;
      });
    }
  }

  Future<void> _requestPermissions() async {
    final status = await ref.read(permissionServiceProvider).requestLocationPermission();
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
        setState(() => _isProcessing = true);
        HapticFeedback.mediumImpact();
        ref.read(smartPassProvider.notifier).scanAndVerifyPass(code).then((_) {
          if (mounted) setState(() => _isProcessing = false);
        });
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final passState = ref.watch(smartPassProvider);
    final hasPermission = _permissionStatus?.hasLocationAccess ?? true;
    final isLocationServiceOn = _permissionStatus?.isLocationServiceEnabled ?? true;

    return Scaffold(
      appBar: const GlassAppBar(title: 'Smart Pass Scanner', showBack: true),
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (passState.scanResult != null)
                _buildSuccessCard(passState.scanResult!)
              else if (!hasPermission || !isLocationServiceOn)
                _buildPermissionCard()
              else ...[
                _buildLiveScanner(passState.isLoading),
                const SizedBox(height: 16),
                if (passState.errorMessage != null)
                  _buildErrorBanner(passState.errorMessage!),
              ],
              const SizedBox(height: 16),
              const SmartPassGuidelinesCard(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPermissionCard() {
    final isPermanent = _permissionStatus?.isPermanentlyDenied ?? false;
    final isGpsOff = !(_permissionStatus?.isLocationServiceEnabled ?? true);

    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: SasColors.warning.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isGpsOff ? Icons.location_disabled_rounded : Icons.location_searching_rounded,
              size: 44,
              color: SasColors.warning,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isGpsOff ? 'Device GPS Is Turned Off' : 'Location Permission Required',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: SasColors.textPrimary),
          ),
          const SizedBox(height: 6),
          Text(
            isGpsOff
                ? 'Please turn on GPS/Location services on your device to verify class attendance.'
                : isPermanent
                    ? 'Location access is permanently disabled. Please tap below to open App Settings and grant permission.'
                    : 'Classroom verification requires physical location proximity using GPS.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: SasColors.textMuted),
          ),
          const SizedBox(height: 18),
          GlassButton(
            label: isPermanent
                ? 'Open App Settings'
                : isGpsOff
                    ? 'Turn On GPS'
                    : 'Grant Permission',
            icon: Icons.check_circle_outline_rounded,
            isLoading: _checkingPermission,
            onPressed: _checkingPermission ? null : _requestPermissions,
          ),
        ],
      ),
    );
  }

  Widget _buildLiveScanner(bool isLoading) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 280,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: SasColors.accentEmerald.withValues(alpha: 0.5),
                  width: 2,
                ),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  MobileScanner(
                    controller: _scannerController,
                    onDetect: _onDetect,
                    errorBuilder: (context, error) {
                      return Container(
                        color: Colors.black87,
                        padding: const EdgeInsets.all(16),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.videocam_off_rounded, size: 40, color: SasColors.warning),
                              const SizedBox(height: 10),
                              const Text(
                                'Camera Access Required',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                error.errorDetails?.message ?? 'Please grant camera permission to scan QR codes.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: SasColors.textMuted, fontSize: 11),
                              ),
                              const SizedBox(height: 12),
                              GlassButton(
                                label: 'Start Camera',
                                height: 38,
                                onPressed: () => _scannerController.start(),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Row(
                      children: [
                        IconButton(
                          icon: ValueListenableBuilder(
                            valueListenable: _scannerController,
                            builder: (context, state, child) {
                              return Icon(
                                state.torchState == TorchState.on
                                    ? Icons.flash_on_rounded
                                    : Icons.flash_off_rounded,
                                color: Colors.white,
                                size: 20,
                              );
                            },
                          ),
                          onPressed: () => _scannerController.toggleTorch(),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.cameraswitch_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          onPressed: () => _scannerController.switchCamera(),
                        ),
                      ],
                    ),
                  ),
                  if (isLoading || _isProcessing)
                    Container(
                      color: Colors.black.withValues(alpha: 0.65),
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(color: SasColors.accentEmerald),
                            SizedBox(height: 12),
                            Text(
                              'Verifying attendance...',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'Point camera at the teacher\'s QR code',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: SasColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Location and device are checked automatically.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: SasColors.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String error) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: SasColors.danger.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: SasColors.danger.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline_rounded, size: 18, color: SasColors.danger),
            const SizedBox(width: 8),
            Expanded(
              child: Text(error, style: const TextStyle(fontSize: 12, color: SasColors.danger, fontWeight: FontWeight.w500)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessCard(SmartPassScanResult result) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SasColors.accentEmerald.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded, size: 48, color: SasColors.accentEmerald),
          ),
          const SizedBox(height: 14),
          Text(
            result.message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: SasColors.textPrimary),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: SasColors.bgSurface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                _infoRow('Class', result.className),
                _infoRow('Subject', result.subject),
                _infoRow('Student', result.studentName),
                _infoRow('Status', result.attendanceStatus, isHighlight: true),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassButton(
            label: 'Scan Another Code',
            icon: Icons.qr_code_scanner_rounded,
            onPressed: () {
              setState(() => _isProcessing = false);
              ref.read(smartPassProvider.notifier).resetScan();
              _scannerController.start();
            },
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: SasColors.textMuted)),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isHighlight ? FontWeight.w800 : FontWeight.w600,
              color: isHighlight ? SasColors.accentEmerald : SasColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
