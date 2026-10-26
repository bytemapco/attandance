import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';

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
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                SasColors.osageOrange.withValues(alpha: isDark ? 0.25 : 0.15),
                SasColors.sunsetInItaly.withValues(alpha: isDark ? 0.12 : 0.08),
              ],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: SasColors.osageOrange.withValues(alpha: isDark ? 0.35 : 0.25),
              width: 1.2,
            ),
          ),
          child: Center(
            child: Text(
              _getInitials(),
              style: const TextStyle(
                color: SasColors.osageOrange,
                fontSize: 16.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _getDisplayName(),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? SasColors.brilliance : SasColors.indianInk,
                  letterSpacing: -0.4,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 3),
              Row(
                children: [
                  if (enrollment.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: SasColors.osageOrange.withValues(alpha: isDark ? 0.2 : 0.12),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        enrollment,
                        style: const TextStyle(
                          color: SasColors.osageOrange,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                    if (institution.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Text(
                        '•',
                        style: TextStyle(
                          color: isDark ? const Color(0x66BAC0BE) : const Color(0x66858997),
                          fontSize: 11,
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
                          color: isDark ? SasColors.maidenMist : SasColors.textMuted,
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
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.push('/notifications'),
            borderRadius: BorderRadius.circular(13),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isDark ? const Color(0x1AFFFFFF) : const Color(0x0A000000),
                borderRadius: BorderRadius.circular(13),
                border: Border.all(
                  color: isDark ? const Color(0x2EBAC0BE) : const Color(0x24BAC0BE),
                  width: 0.8,
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    Icons.notifications_none_rounded,
                    size: 20,
                    color: isDark ? SasColors.brilliance : SasColors.indianInk,
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: SasColors.osageOrange,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
