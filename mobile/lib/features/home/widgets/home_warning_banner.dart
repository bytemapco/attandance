import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class HomeWarningBanner extends StatelessWidget {
  final double percentage;
  final VoidCallback onTap;

  const HomeWarningBanner({
    super.key,
    required this.percentage,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderColor: SasColors.warning.withValues(alpha: 0.3),
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: SasColors.warning.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(
              Icons.warning_amber_rounded,
              size: 18,
              color: SasColors.warning,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Low Attendance Warning',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: SasColors.warning,
                  ),
                ),
                Text(
                  'Current attendance is ${percentage.toStringAsFixed(0)}% — below the 75% institutional requirement.',
                  style: const TextStyle(
                    color: SasColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            color: SasColors.textMuted,
            size: 18,
          ),
        ],
      ),
    );
  }
}
