import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_brand_header.dart';

import 'package:smart_attendance_app/shared/widgets/fade_slide_transition.dart';

/// Top section of Screen 1 displaying the golden hour campus backdrop,
/// "Your Attendance Made Simple" headline, and the 3-feature floating card.
class AuthHeroSection extends StatelessWidget {
  const AuthHeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFFE2E8F0)
        : const Color(0xFF334155);

    final screenHeight = MediaQuery.of(context).size.height;
    final isCompact = screenHeight < 720;
    final topGap = isCompact ? 20.0 : 48.0;
    final titleSize = isCompact ? 28.0 : 32.0;

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Brand logo header
            FadeSlideTransition(
              delay: Duration.zero,
              beginOffset: const Offset(0, -0.06),
              child: AuthBrandHeader(isLightBackground: !isDark),
            ),
            SizedBox(height: topGap),

            // Main headline with clean, balanced typography placed lower in the mid-sky area
            FadeSlideTransition(
              delay: const Duration(milliseconds: 60),
              beginOffset: const Offset(0, -0.04),
              child: Text.rich(
                TextSpan(
                  text: 'Your\nAttendance\nMade ',
                  style: SasTypography.style(
                    fontSize: titleSize,
                    fontWeight: FontWeight.w600,
                    color: primaryTextColor,
                    height: 1.15,
                    letterSpacing: -0.6,
                  ),
                  children: const [
                    TextSpan(
                      text: 'Simple',
                      style: TextStyle(
                        color: Color(0xFFF95721),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Subtitle
            FadeSlideTransition(
              delay: const Duration(milliseconds: 100),
              beginOffset: const Offset(0, -0.03),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 300),
                child: Text(
                  'Stay connected with your academic journey,\nanytime, anywhere.',
                  style: SasTypography.style(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w400,
                    color: subtitleColor,
                    height: 1.35,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
