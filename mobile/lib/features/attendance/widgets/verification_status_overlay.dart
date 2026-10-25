import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class VerificationStatusOverlay extends StatelessWidget {
  final String title;
  final String? subtitle;
  final int? activeStepIndex;
  final List<String>? stepLabels;

  const VerificationStatusOverlay({
    super.key,
    required this.title,
    this.subtitle,
    this.activeStepIndex,
    this.stepLabels,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        children: [
          const SizedBox(height: 24),
          const SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(strokeWidth: 3, color: SasColors.accentEmerald),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              color: SasColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: const TextStyle(
                color: SasColors.accentEmerald,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          if (stepLabels != null && activeStepIndex != null) ...[
            const SizedBox(height: 12),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              child: Text(
                stepLabels![activeStepIndex!],
                key: ValueKey(activeStepIndex),
                style: const TextStyle(
                  color: SasColors.accentEmerald,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(stepLabels!.length, (i) {
                final isDone = i <= activeStepIndex!;
                return Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDone ? SasColors.accentEmerald : SasColors.glassBorder,
                  ),
                );
              }),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
