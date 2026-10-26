import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

class AuthFormHeader extends StatelessWidget {
  final VoidCallback onBackPressed;
  final String title;
  final String subtitle;

  const AuthFormHeader({
    super.key,
    required this.onBackPressed,
    this.title = 'Log in',
    this.subtitle = 'Sign in to your account',
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? SasColors.brilliance : SasColors.indianInk;
    final backBtnBg = isDark ? SasColors.darkCanvas : SasColors.polishWhite;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            InkWell(
              onTap: onBackPressed,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: backBtnBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.chevron_left_rounded,
                  color: primaryTextColor,
                  size: 22,
                ),
              ),
            ),
            Text(
              title,
              style: SasTypography.style(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: primaryTextColor,
              ),
            ),
            const SizedBox(width: 36),
          ],
        ),
        const SizedBox(height: 18),
        Text(
          subtitle,
          style: SasTypography.style(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.4,
            color: primaryTextColor,
          ),
        ),
      ],
    );
  }
}
