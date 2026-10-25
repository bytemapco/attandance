import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';

class VerificationStepIndicator extends StatelessWidget {
  final VerificationStep current;
  const VerificationStepIndicator({super.key, required this.current});

  @override
  Widget build(BuildContext context) {
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

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(steps.length, (i) {
        final isCompleted = i < currentIdx;
        final isCurrent = i == currentIdx;
        final isActive = i <= currentIdx;
        final isLeftLineActive = i > 0 && i <= currentIdx;
        final isRightLineActive = i < steps.length - 1 && i < currentIdx;

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
                          ? (isLeftLineActive ? SasColors.accentEmerald : SasColors.glassBorder)
                          : Colors.transparent,
                    ),
                  ),
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCompleted
                          ? SasColors.accentEmerald
                          : isCurrent
                              ? SasColors.accentEmerald.withValues(alpha: 0.15)
                              : SasColors.bgSurface,
                      border: Border.all(
                        color: isActive ? SasColors.accentEmerald : SasColors.glassBorder,
                        width: isCurrent ? 2 : 1,
                      ),
                      boxShadow: isCurrent
                          ? [
                              BoxShadow(
                                color: SasColors.accentEmerald.withValues(alpha: 0.25),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: isCompleted
                          ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                          : Text(
                              '${i + 1}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                                color: isCurrent
                                    ? SasColors.accentEmerald
                                    : isActive
                                        ? SasColors.textPrimary
                                        : SasColors.textMuted,
                              ),
                            ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      height: 2.5,
                      color: i < steps.length - 1
                          ? (isRightLineActive ? SasColors.accentEmerald : SasColors.glassBorder)
                          : Colors.transparent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                steps[i],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                  color: isCurrent
                      ? SasColors.accentEmerald
                      : isActive
                          ? SasColors.textPrimary
                          : SasColors.textMuted,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
