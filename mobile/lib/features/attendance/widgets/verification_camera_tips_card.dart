import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

class VerificationCameraTipsCard extends StatelessWidget {
  final VoidCallback onDismissTips;

  const VerificationCameraTipsCard({super.key, required this.onDismissTips});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? const Color(0x1FFFFFFF)
        : const Color(0xFFE3E9F1);
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
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
                  color: const Color(0xFFFFEDD5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(
                  child: Icon(
                    Icons.tips_and_updates_rounded,
                    color: Color(0xFFEA580C),
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Tips for best verification',
                style: SasTypography.style(
                  fontWeight: FontWeight.w700,
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
            child: GlassButton(
              label: 'Got it, Open Camera',
              variant: GlassButtonVariant.primary,
              onPressed: onDismissTips,
            ),
          ),
        ],
      ),
    );
  }
}
