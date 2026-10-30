import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
            color: isDark ? const Color(0xFF332314) : const Color(0xFFFFEDD5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'STUDENT',
            style: SasTypography.style(
              color: const Color(0xFFEA580C),
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Face ID Verified Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF143828) : const Color(0xFFECFDF5),
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
                    ? const Color(0xFF10B981)
                    : const Color(0xFFF59E0B),
              ),
              const SizedBox(width: 4),
              Text(
                isFaceVerified ? 'Face ID Verified' : 'Face ID Pending',
                style: SasTypography.style(
                  color: isFaceVerified
                      ? const Color(0xFF059669)
                      : const Color(0xFFD97706),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
