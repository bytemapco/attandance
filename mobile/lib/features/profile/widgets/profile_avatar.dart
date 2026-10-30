import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
        color: isDark ? const Color(0xFF332314) : const Color(0xFFFFE4D6),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF7C2D12) : const Color(0xFFFFD1BD),
          width: 1.0,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: SasTypography.style(
            color: const Color(0xFFEA580C),
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
