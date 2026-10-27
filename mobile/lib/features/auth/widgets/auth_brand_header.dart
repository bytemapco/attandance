import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Reusable brand header featuring the "SMART ATTENDANCE" logo badge
/// and optional circular back navigation button.
class AuthBrandHeader extends StatelessWidget {
  final VoidCallback? onBackPressed;
  final bool isLightBackground;

  const AuthBrandHeader({
    super.key,
    this.onBackPressed,
    this.isLightBackground = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final smartTextColor = isLightBackground
        ? (isDark ? SasColors.brilliance : const Color(0xFF0F172A))
        : SasColors.brilliance;

    final backBtnBg = isDark ? SasColors.darkSurface : Colors.white;
    final backBtnBorder =
        isDark ? const Color(0x1EFFFFFF) : const Color(0x12000000);

    final logoWidget = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFFF7A18),
                Color(0xFFF95721),
              ],
            ),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF95721).withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: const Center(
            child: Icon(
              Icons.school_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
        ),
        const SizedBox(width: 9),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'SMART',
              style: SasTypography.style(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: smartTextColor,
                height: 1.0,
              ),
            ),
            Text(
              'ATTENDANCE',
              style: SasTypography.style(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: const Color(0xFFF95721),
                height: 1.05,
              ),
            ),
          ],
        ),
      ],
    );

    if (onBackPressed == null) {
      // Screen 1: Logo on the left
      return Row(
        children: [
          logoWidget,
          const Spacer(),
        ],
      );
    }

    // Screen 2: Back button on the left, logo on the right
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        InkWell(
          onTap: onBackPressed,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: backBtnBg,
              shape: BoxShape.circle,
              border: Border.all(color: backBtnBorder, width: 1.0),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              Icons.chevron_left_rounded,
              color: smartTextColor,
              size: 24,
            ),
          ),
        ),
        logoWidget,
      ],
    );
  }
}
