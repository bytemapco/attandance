import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';

class VerificationStepIndicator extends StatelessWidget {
  final VerificationStep current;
  const VerificationStepIndicator({super.key, required this.current});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const steps = ['GPS', 'Camera', 'Preview', 'AI Check', 'Submit'];

    final currentIdx = switch (current) {
      VerificationStep.gps => 0,
      VerificationStep.camera => 1,
      VerificationStep.preview => 2,
      VerificationStep.submitting => 3,
      VerificationStep.reviewing => 3,
      VerificationStep.confirming => 4,
      VerificationStep.done => 4,
    };

    final inactiveTrack = isDark
        ? SasColors.darkSurface
        : SasColors.lightElevated;
    final borderCol = isDark
        ? SasColors.darkBorder
        : SasColors.border;
    const orangeCol = SasColors.copper;
    const emeraldCol = SasColors.success;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(steps.length, (i) {
        final isCompleted = i < currentIdx;
        final isCurrent = i == currentIdx;
        final isLeftLineActive = i > 0 && i <= currentIdx;
        final isRightLineActive = i < steps.length - 1 && i < currentIdx;

        final stepColor = isCompleted
            ? emeraldCol
            : isCurrent
            ? orangeCol
            : (isDark ? SasColors.textMuted : SasColors.mutedOnDark);

        return Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 2.5,
                      color: i > 0
                          ? (isLeftLineActive ? emeraldCol : inactiveTrack)
                          : Colors.transparent,
                    ),
                  ),
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCompleted
                          ? emeraldCol
                          : isCurrent
                          ? (isDark
                                ? SasColors.darkElevated
                                : SasColors.copperSoft)
                          : inactiveTrack,
                      border: Border.all(
                        color: isCompleted
                            ? emeraldCol
                            : isCurrent
                            ? orangeCol
                            : borderCol,
                        width: isCurrent ? 2.2 : 1.2,
                      ),
                    ),
                    child: Center(
                      child: isCompleted
                          ? const Icon(
                              Icons.check_rounded,
                              size: 16,
                              color: Colors.white,
                            )
                          : Text(
                              '${i + 1}',
                              style: SasTypography.style(
                                fontSize: 12,
                                fontWeight: isCurrent
                                    ? FontWeight.w600
                                    : FontWeight.w600,
                                color: isCurrent ? orangeCol : stepColor,
                              ),
                            ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      height: 2.5,
                      color: i < steps.length - 1
                          ? (isRightLineActive ? emeraldCol : inactiveTrack)
                          : Colors.transparent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                steps[i],
                textAlign: TextAlign.center,
                style: SasTypography.style(
                  fontSize: 11,
                  fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                  color: isCurrent
                      ? (isDark
                            ? SasColors.ivory
                            : SasColors.ink)
                      : stepColor,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
