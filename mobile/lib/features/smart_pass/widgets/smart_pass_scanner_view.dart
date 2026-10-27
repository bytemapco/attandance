import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

/// Camera view finder for QR scanning in Smart Pass.
class SmartPassScannerView extends StatelessWidget {
  final MobileScannerController controller;
  final bool isLoading;
  final bool isProcessing;
  final void Function(BarcodeCapture) onDetect;

  const SmartPassScannerView({
    super.key,
    required this.controller,
    required this.isLoading,
    required this.isProcessing,
    required this.onDetect,
  });

  @override
  Widget build(BuildContext context) {
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
                    controller: controller,
                    onDetect: onDetect,
                    errorBuilder: (context, error) {
                      return Container(
                        color: Colors.black87,
                        padding: const EdgeInsets.all(16),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.videocam_off_rounded,
                                size: 40,
                                color: SasColors.warning,
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'Camera Access Required',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                error.errorDetails?.message ??
                                    'Please grant camera permission to scan QR codes.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: SasColors.textMuted,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 12),
                              GlassButton(
                                label: 'Start Camera',
                                height: 38,
                                onPressed: () => controller.start(),
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
                            valueListenable: controller,
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
                          onPressed: () => controller.toggleTorch(),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.cameraswitch_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          onPressed: () => controller.switchCamera(),
                        ),
                      ],
                    ),
                  ),
                  if (isLoading || isProcessing)
                    Container(
                      color: Colors.black.withValues(alpha: 0.65),
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(
                              color: SasColors.accentEmerald,
                            ),
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
            "Point camera at the teacher's QR code",
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
}
