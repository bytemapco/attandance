import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_action_buttons.dart';

class VerificationStepBottomBar extends StatelessWidget {
  final VerificationStep step;
  final bool showTips;
  final bool isCameraReady;
  final VoidCallback onCapture;
  final VoidCallback onRetake;
  final VoidCallback onAnalyze;
  final VoidCallback onSubmit;

  const VerificationStepBottomBar({
    super.key,
    required this.step,
    required this.showTips,
    required this.isCameraReady,
    required this.onCapture,
    required this.onRetake,
    required this.onAnalyze,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    if (step == VerificationStep.camera && !showTips) {
      return Padding(
        padding: const EdgeInsets.only(top: 16),
        child: VerificationActionButtons(
          primaryLabel: 'Capture',
          primaryIcon: Icons.camera_alt_rounded,
          onPrimaryPressed: isCameraReady ? onCapture : null,
          secondaryLabel: 'Cancel',
          isSecondaryGhost: true,
          onSecondaryPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
      );
    }
    if (step == VerificationStep.preview) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: VerificationActionButtons(
          primaryLabel: 'Analyze',
          primaryIcon: Icons.auto_awesome_rounded,
          onPrimaryPressed: onAnalyze,
          secondaryLabel: 'Retake',
          secondaryIcon: Icons.refresh_rounded,
          onSecondaryPressed: onRetake,
        ),
      );
    }
    if (step == VerificationStep.reviewing) {
      return Padding(
        padding: const EdgeInsets.only(top: 16),
        child: VerificationActionButtons(
          primaryLabel: 'Submit',
          primaryIcon: Icons.check_rounded,
          onPrimaryPressed: onSubmit,
          secondaryLabel: 'Retake',
          secondaryIcon: Icons.refresh_rounded,
          onSecondaryPressed: onRetake,
        ),
      );
    }
    return const SizedBox.shrink();
  }
}
