import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

class LoginFooter extends StatelessWidget {
  const LoginFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.shield_outlined,
              size: 14,
              color: SasColors.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              'Biometric & Geofence Protected',
              style: SasTypography.style(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: SasColors.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'Students only • Faculty access via Web Portal',
          style: SasTypography.style(
            fontSize: 11.5,
            fontWeight: FontWeight.w400,
            color: SasColors.textMuted,
          ),
        ),
      ],
    );
  }
}
