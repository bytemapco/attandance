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
      backgroundColor: isDark ? SasColors.darkSurface : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      title: Text(
        'Sign Out?',
        style: SasTypography.style(
          fontWeight: FontWeight.w600,
          fontSize: 18,
          color: isDark ? SasColors.ivory : SasColors.ink,
        ),
      ),
      content: Text(
        'You will need to re-authenticate with your university credentials to access the app.',
        style: SasTypography.style(
          color: isDark ? SasColors.textOnDark : SasColors.textMuted,
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
              color: isDark ? SasColors.textOnDark : SasColors.textMuted,
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
              color: SasColors.danger,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );
}
