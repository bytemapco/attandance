import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Small lock badge indicating 256-bit encrypted secure student sign-in.
class AuthSecurityBadge extends StatelessWidget {
  final Color textColor;

  const AuthSecurityBadge({super.key, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_outline_rounded, size: 14, color: textColor),
          const SizedBox(width: 6),
          Text(
            'Secure student sign-in',
            style: SasTypography.style(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
