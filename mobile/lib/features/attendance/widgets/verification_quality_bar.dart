import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

class VerificationQualityBar extends StatelessWidget {
  final String label;
  final double value;
  final double goodThreshold;

  const VerificationQualityBar({
    super.key,
    required this.label,
    required this.value,
    required this.goodThreshold,
  });

  @override
  Widget build(BuildContext context) {
    final clamped = value.clamp(0.0, 1.0);
    final isGood = clamped >= goodThreshold;
    final color = isGood ? SasColors.accentEmerald : SasColors.warning;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: SasColors.textSecondary)),
            Text(
              isGood ? 'Good' : 'Suboptimal',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: clamped,
          backgroundColor: SasColors.glassBorder,
          valueColor: AlwaysStoppedAnimation<Color>(color),
          borderRadius: BorderRadius.circular(4),
          minHeight: 6,
        ),
      ],
    );
  }
}
