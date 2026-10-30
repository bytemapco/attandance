import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

Future<void> showSignOutDialog(
  BuildContext context, {
  required VoidCallback onConfirm,
}) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  return showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: isDark ? const Color(0xFF1E2838) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        'Sign Out?',
        style: SasTypography.style(
          fontWeight: FontWeight.w800,
          fontSize: 18,
          color: isDark ? SasColors.brilliance : const Color(0xFF0F172A),
        ),
      ),
      content: Text(
        'You will need to re-authenticate with your university credentials to access the app.',
        style: SasTypography.style(
          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B),
          fontSize: 13.5,
          height: 1.4,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: Text(
            'Cancel',
            style: SasTypography.style(
              fontSize: 14,
              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        TextButton(
          onPressed: () {
            Navigator.of(ctx).pop();
            onConfirm();
          },
          child: Text(
            'Sign Out',
            style: SasTypography.style(
              fontSize: 14,
              color: const Color(0xFFEF4444),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}
