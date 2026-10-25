import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class ProfileHeaderCard extends StatelessWidget {
  final dynamic user;
  final dynamic profile;

  const ProfileHeaderCard({
    super.key,
    required this.user,
    required this.profile,
  });

  String _getInitials() {
    final String? f = profile?.firstName;
    final String? l = profile?.lastName;
    if (f != null && l != null && f.isNotEmpty && l.isNotEmpty) {
      return '${f[0]}${l[0]}'.toUpperCase();
    }
    final String? email = user?.email;
    return (email != null && email.isNotEmpty) ? email[0].toUpperCase() : 'S';
  }

  @override
  Widget build(BuildContext context) {
    final name = (profile?.firstName != null && profile?.lastName != null)
        ? '${profile.firstName} ${profile.lastName}'
        : user?.email ?? 'Student';
    final isFaceVerified = profile?.faceRegistered == true;

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: SasColors.accentEmerald.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: SasColors.accentEmerald.withValues(alpha: 0.3),
                width: 1.2,
              ),
            ),
            child: Center(
              child: Text(
                _getInitials(),
                style: const TextStyle(
                  color: SasColors.accentEmerald,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: SasColors.textPrimary,
                    letterSpacing: -0.2,
                  ),
                ),
                if (profile?.enrollmentNumber != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Roll No: ${profile.enrollmentNumber}',
                    style: const TextStyle(
                      color: SasColors.textMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                if (profile?.departmentName != null || profile?.branch != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    [
                      if (profile?.branch != null) profile.branch,
                      if (profile?.semester != null) 'Sem ${profile.semester}',
                      if (profile?.departmentName != null) profile.departmentName,
                    ].join(' • '),
                    style: const TextStyle(
                      color: SasColors.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (user?.tenantName != null && (user.tenantName as String).isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.account_balance_rounded,
                        size: 11,
                        color: SasColors.textMuted,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          user.tenantName as String,
                          style: const TextStyle(
                            color: SasColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: SasColors.accentEmerald.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        (user?.role as String? ?? 'STUDENT').toUpperCase(),
                        style: const TextStyle(
                          color: SasColors.accentEmerald,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: (isFaceVerified
                                ? SasColors.success
                                : SasColors.warning)
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isFaceVerified
                                ? Icons.verified_user_rounded
                                : Icons.error_outline_rounded,
                            size: 10,
                            color: isFaceVerified
                                ? SasColors.success
                                : SasColors.warning,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            isFaceVerified
                                ? 'Face ID Verified'
                                : 'Face ID Pending',
                            style: TextStyle(
                              color: isFaceVerified
                                  ? SasColors.success
                                  : SasColors.warning,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
