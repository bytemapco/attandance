import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

class ProfileAvatar extends StatelessWidget {
  final String initials;
  final bool isDark;

  const ProfileAvatar({
    super.key,
    required this.initials,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 66,
      height: 66,
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkWarningSoft : SasColors.copperSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.copperStrong : SasColors.copperSoft,
          width: 1.0,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: SasTypography.style(
            color: SasColors.copperStrong,
            fontSize: 22,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
