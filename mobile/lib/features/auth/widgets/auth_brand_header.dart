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
    final backBtnBorder = isDark
        ? const Color(0x1EFFFFFF)
        : const Color(0x12000000);

    final logoWidget = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 36,
          height: 36,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Image.asset(
              'assets/images/sahaj_app_icon.png',
              width: 36,
              height: 36,
              cacheWidth: 72,
              cacheHeight: 72,
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'SAHAJ',
              style: SasTypography.style(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
                color: smartTextColor,
                height: 1.0,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Campus, made effortless',
              style: SasTypography.style(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.3,
                color: isDark ? SasColors.maidenMist : const Color(0xFF526F78),
                height: 1.0,
              ),
            ),
          ],
        ),
      ],
    );

    if (onBackPressed == null) {
      // Screen 1: Logo on the left
      return Row(children: [logoWidget, const Spacer()]);
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
