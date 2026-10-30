import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/domain/models/user.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_avatar.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_badges_row.dart';

/// User identity card with peach avatar, student metadata, and verification badges.
class ProfileHeaderCard extends StatelessWidget {
  final UserProfile? user;
  final StudentProfile? profile;

  const ProfileHeaderCard({
    super.key,
    required this.user,
    required this.profile,
  });

  String _getInitials() {
    final f = profile?.firstName?.trim() ?? '';
    final l = profile?.lastName?.trim() ?? '';
    if (f.isNotEmpty && l.isNotEmpty) {
      return '${f[0]}${l[0]}'.toUpperCase();
    }
    if (f.isNotEmpty) return f[0].toUpperCase();
    if (user != null && user!.email.isNotEmpty) {
      return user!.email[0].toUpperCase();
    }
    return 'ST';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    final String fullName = [profile?.firstName, profile?.lastName]
        .whereType<String>()
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .join(' ');
    final name = fullName.isNotEmpty ? fullName : (user?.email ?? 'Student');
    final rollNo = profile?.enrollmentNumber ?? '';
    final branch = profile?.branch ?? '';
    final semester = profile?.semester != null
        ? 'Sem ${profile!.semester}'
        : '';
    final department = profile?.departmentName ?? '';
    final metaParts = [
      branch,
      semester,
      department,
    ].where((s) => s.isNotEmpty).join(' • ');
    final institution = user?.tenantName?.trim() ?? '';
    final isFaceVerified = profile?.faceRegistered == true;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Peach Squircle Avatar
          ProfileAvatar(
            initials: _getInitials(),
            isDark: isDark,
          ),
          const SizedBox(width: 14),

          // User details and badges
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: SasTypography.style(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: primaryTextColor,
                    letterSpacing: -0.3,
                  ),
                ),
                if (rollNo.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    'Roll No: $rollNo',
                    style: SasTypography.style(
                      color: subtitleColor,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                if (metaParts.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    metaParts,
                    style: SasTypography.style(
                      color: subtitleColor,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (institution.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(
                        Icons.account_balance_rounded,
                        size: 13,
                        color: subtitleColor,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          institution,
                          style: SasTypography.style(
                            color: subtitleColor,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 10),

                // Badges Row
                ProfileBadgesRow(
                  isDark: isDark,
                  isFaceVerified: isFaceVerified,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
