import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Smart Pass QR and Face Match action buttons rendered inside active session card.
class HomeSessionActionButtons extends StatelessWidget {
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;

  const HomeSessionActionButtons({
    super.key,
    required this.onSmartPass,
    required this.onFaceMatch,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);

    return Row(
      children: [
        // Smart Pass QR Button (Orange Gradient)
        Expanded(
          child: InkWell(
            onTap: onSmartPass,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF95721), Color(0xFFFF7A18)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF95721).withValues(alpha: 0.28),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.qr_code_2_rounded,
                    size: 19,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 7),
                  Text(
                    'Smart Pass QR',
                    style: SasTypography.style(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Face Match Button (White / Surface Bordered)
        Expanded(
          child: InkWell(
            onTap: onFaceMatch,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark
                      ? const Color(0x33FFFFFF)
                      : const Color(0xFFE2E8F0),
                  width: 1.2,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.filter_center_focus_rounded,
                    size: 19,
                    color: primaryTextColor,
                  ),
                  const SizedBox(width: 7),
                  Text(
                    'Face Match',
                    style: SasTypography.style(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: primaryTextColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
