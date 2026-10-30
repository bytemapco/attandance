import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/shared/widgets/fade_slide_transition.dart';

class AuthPasswordHeading extends StatelessWidget {
  final Color primaryTextColor;
  final Color subtitleColor;

  const AuthPasswordHeading({
    super.key,
    required this.primaryTextColor,
    required this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return FadeSlideTransition(
      delay: const Duration(milliseconds: 60),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome Back!',
            style: SasTypography.style(
              fontSize: 28,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: primaryTextColor,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Enter your password to access your account',
            style: SasTypography.style(
              fontSize: 13.5,
              fontWeight: FontWeight.w400,
              color: subtitleColor,
            ),
          ),
        ],
      ),
    );
  }
}
