import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';

class VerificationCameraTipsCard extends StatelessWidget {
  final VoidCallback onDismissTips;

  const VerificationCameraTipsCard({super.key, required this.onDismissTips});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? SasColors.darkBorder
        : SasColors.border;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: SasColors.copperSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(
                  child: Icon(
                    Icons.tips_and_updates_rounded,
                    color: SasColors.copperStrong,
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Tips for best verification',
                style: SasTypography.style(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: primaryTextColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '• Look straight at the camera lens\n'
            '• Ensure good, uniform ambient lighting\n'
            '• Remove heavy sunglasses or face coverings\n'
            '• Keep your whole face centered within the oval',
            style: SasTypography.style(
              color: subtitleColor,
              fontSize: 13.5,
              height: 1.6,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              label: 'Got it, Open Camera',
              variant: AppButtonVariant.primary,
              onPressed: onDismissTips,
            ),
          ),
        ],
      ),
    );
  }
}
