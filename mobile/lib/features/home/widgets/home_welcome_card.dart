import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';

class HomeWelcomeCard extends ConsumerWidget {
  final dynamic user;
  final int pendingCount;
  const HomeWelcomeCard({super.key, required this.user, required this.pendingCount});

  String _getInitials() {
    if (user?.studentProfile?.firstName != null &&
        user?.studentProfile?.lastName != null) {
      final String first = user.studentProfile.firstName;
      final String last = user.studentProfile.lastName;
      if (first.isNotEmpty && last.isNotEmpty) {
        return '${first[0]}${last[0]}'.toUpperCase();
      }
    }
    final String? email = user?.email;
    if (email != null && email.isNotEmpty) {
      return email[0].toUpperCase();
    }
    return 'S';
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 4 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    final name = (user?.studentProfile?.firstName != null &&
            user?.studentProfile?.lastName != null)
        ? '${user?.studentProfile?.firstName} ${user?.studentProfile?.lastName}'
        : user?.email ?? 'Student';
    final enrollmentNumber = user?.studentProfile?.enrollmentNumber ?? '';

    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: SasColors.accentEmerald.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: SasColors.accentEmerald.withValues(alpha: 0.25),
              width: 1.0,
            ),
          ),
          child: Center(
            child: Text(
              _getInitials(),
              style: const TextStyle(
                color: SasColors.accentEmerald,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (user?.tenantName != null && (user.tenantName as String).isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.account_balance_rounded,
                        size: 10,
                        color: SasColors.accentEmerald,
                      ),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(
                          user.tenantName as String,
                          style: const TextStyle(
                            color: SasColors.accentEmerald,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              Text(
                _getGreeting(),
                style: const TextStyle(
                  color: SasColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: SasColors.textPrimary,
                  letterSpacing: -0.2,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (enrollmentNumber.isNotEmpty)
                Text(
                  enrollmentNumber,
                  style: const TextStyle(
                    color: SasColors.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
          decoration: BoxDecoration(
            color: pendingCount > 0
                ? SasColors.warning.withValues(alpha: 0.08)
                : SasColors.success.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: pendingCount > 0
                  ? SasColors.warning.withValues(alpha: 0.25)
                  : SasColors.success.withValues(alpha: 0.25),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                pendingCount > 0 ? Icons.sync_problem_rounded : Icons.cloud_done_rounded,
                color: pendingCount > 0 ? SasColors.warning : SasColors.success,
                size: 12,
              ),
              const SizedBox(width: 3),
              Text(
                pendingCount > 0 ? '$pendingCount' : 'Synced',
                style: TextStyle(
                  color: pendingCount > 0 ? SasColors.warning : SasColors.success,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 6),
        IconButton(
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
          icon: Badge(
            isLabelVisible: unreadCount > 0,
            label: Text('$unreadCount', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
            backgroundColor: SasColors.accentEmerald,
            child: Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: SasColors.bgSecondary,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: SasColors.glassBorder),
              ),
              child: const Icon(Icons.notifications_none_rounded, size: 18, color: SasColors.textPrimary),
            ),
          ),
          onPressed: () => context.push('/notifications'),
          tooltip: 'Notifications',
        ),
      ],
    );
  }
}
