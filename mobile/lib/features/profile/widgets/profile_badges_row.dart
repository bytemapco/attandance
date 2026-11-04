import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

class ProfileBadgesRow extends StatelessWidget {
  final bool isDark;
  final bool isFaceVerified;

  const ProfileBadgesRow({
    super.key,
    required this.isDark,
    required this.isFaceVerified,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Student Role Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkWarningSoft : SasColors.copperSoft,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'STUDENT',
            style: SasTypography.style(
              color: SasColors.copperStrong,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Face ID Verified Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkSuccessSoft : SasColors.successSoft,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isFaceVerified
                    ? Icons.check_circle_rounded
                    : Icons.error_outline_rounded,
                size: 12,
                color: isFaceVerified
                    ? SasColors.success
                    : SasColors.warning,
              ),
              const SizedBox(width: 4),
              Text(
                isFaceVerified ? 'Face ID Verified' : 'Face ID Pending',
                style: SasTypography.style(
                  color: isFaceVerified
                      ? SasColors.success
                      : SasColors.warning,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
