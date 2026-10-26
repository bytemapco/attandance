import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

class AuthWelcomeView extends StatelessWidget {
  final VoidCallback onSignInPressed;
  final VoidCallback onResetPasswordPressed;

  const AuthWelcomeView({
    super.key,
    required this.onSignInPressed,
    required this.onResetPasswordPressed,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? SasColors.brilliance : SasColors.indianInk;
    final primaryBtnBg = isDark ? SasColors.osageOrange : SasColors.indianInk;
    final primaryBtnText = SasColors.brilliance;
    final secondaryBorder = isDark ? SasColors.indianInk : SasColors.polishWhite;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        SizedBox(
          height: 54,
          child: ElevatedButton(
            onPressed: onSignInPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryBtnBg,
              foregroundColor: primaryBtnText,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(27),
              ),
            ),
            child: Text(
              'Log in',
              style: SasTypography.style(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: primaryBtnText,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 54,
          child: OutlinedButton(
            onPressed: onResetPasswordPressed,
            style: OutlinedButton.styleFrom(
              foregroundColor: primaryTextColor,
              side: BorderSide(color: secondaryBorder, width: 1.2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(27),
              ),
            ),
            child: Text(
              'Forgot Password',
              style: SasTypography.style(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: primaryTextColor,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'By continuing, you agree to University\nAttendance Policy and Terms of Use',
          textAlign: TextAlign.center,
          style: SasTypography.style(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: SasColors.textMuted,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 6),
      ],
    );
  }
}
