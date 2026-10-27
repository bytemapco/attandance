import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/features/home/widgets/home_notification_bell.dart';
import 'package:smart_attendance_app/features/home/widgets/home_welcome_avatar.dart';

class HomeWelcomeCard extends ConsumerWidget {
  final dynamic user;
  final int pendingCount;

  const HomeWelcomeCard({
    super.key,
    required this.user,
    this.pendingCount = 0,
  });

  String _getInitials() {
    final first = user?.studentProfile?.firstName as String? ?? '';
    final last = user?.studentProfile?.lastName as String? ?? '';
    if (first.isNotEmpty && last.isNotEmpty) {
      return '${first[0]}${last[0]}'.toUpperCase();
    }
    final email = user?.email as String? ?? '';
    return email.isNotEmpty ? email[0].toUpperCase() : 'S';
  }

  String _getDisplayName() {
    final first = user?.studentProfile?.firstName as String? ?? '';
    final last = user?.studentProfile?.lastName as String? ?? '';
    if (first.isNotEmpty && last.isNotEmpty) return '$first $last';
    if (first.isNotEmpty) return first;
    return user?.email as String? ?? 'Student';
  }

  String _getEnrollment() =>
      user?.studentProfile?.enrollmentNumber as String? ?? '';

  String _getInstitution() => user?.tenantName as String? ?? '';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    final enrollment = _getEnrollment();
    final institution = _getInstitution();

    return Row(
      children: [
        HomeWelcomeAvatar(
          initials: _getInitials(),
          isDark: isDark,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Hello, ${_getDisplayName().split(' ').first} 👋',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: isDark ? SasColors.brilliance : SasColors.indianInk,
                  letterSpacing: -0.5,
                  height: 1.15,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (enrollment.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 2.5,
                      ),
                      decoration: BoxDecoration(
                        color: SasColors.osageOrange
                            .withValues(alpha: isDark ? 0.18 : 0.10),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        enrollment,
                        style: const TextStyle(
                          color: SasColors.osageOrange,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                    if (institution.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Text(
                        '·',
                        style: TextStyle(
                          color: isDark
                              ? const Color(0x55FFFFFF)
                              : SasColors.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],
                  ],
                  if (institution.isNotEmpty)
                    Expanded(
                      child: Text(
                        institution,
                        style: TextStyle(
                          color: isDark
                              ? SasColors.maidenMist
                              : SasColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          letterSpacing: -0.1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        HomeNotificationBell(
          unreadCount: unreadCount,
          isDark: isDark,
          onTap: () => context.push('/notifications'),
        ),
      ],
    );
  }
}
