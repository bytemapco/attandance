import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

class LoginHeader extends StatelessWidget {
  const LoginHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? SasColors.brilliance : SasColors.indianInk;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: SasColors.osageOrange.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: SasColors.osageOrange.withValues(alpha: 0.35),
              width: 1.2,
            ),
          ),
          child: const Icon(
            Icons.school_rounded,
            color: SasColors.osageOrange,
            size: 26,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Student Portal',
          style: SasTypography.style(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            color: primaryTextColor,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Smart Attendance Verification System',
          style: SasTypography.style(
            fontSize: 13,
            fontWeight: FontWeight.w400,
            color: SasColors.textMuted,
          ),
        ),
      ],
    );
  }
}
