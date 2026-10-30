import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_quick_action_card.dart';

/// 2x2 grid of quick action cards matching target reference screenshot.
class ProfileQuickActions extends StatelessWidget {
  final int unreadCount;

  const ProfileQuickActions({super.key, required this.unreadCount});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: SasTypography.style(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: primaryTextColor,
          ),
        ),
        const SizedBox(height: 10),

        // Row 1: Smart Pass & Notifications
        Row(
          children: [
            Expanded(
              child: ProfileQuickActionCard(
                icon: Icons.qr_code_2_rounded,
                iconColor: const Color(0xFFEA580C),
                iconBgColor: isDark
                    ? const Color(0xFF332314)
                    : const Color(0xFFFFF7ED),
                iconBorderColor: isDark
                    ? const Color(0xFF7C2D12)
                    : const Color(0xFFFED7AA),
                title: 'Smart Pass',
                subtitle: 'Campus digital ID',
                onTap: () => context.push('/smart-pass'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ProfileQuickActionCard(
                icon: Icons.notifications_none_rounded,
                iconColor: const Color(0xFFEF4444),
                iconBgColor: isDark
                    ? const Color(0xFF3F1D24)
                    : const Color(0xFFFFF1F2),
                iconBorderColor: isDark
                    ? const Color(0xFF7F1D1D)
                    : const Color(0xFFFECDD3),
                title: 'Notifications',
                subtitle: 'Alerts & updates',
                badgeCount: unreadCount > 0 ? unreadCount : null,
                onTap: () => context.push('/notifications'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Row 2: Request Leave & Leave History
        Row(
          children: [
            Expanded(
              child: ProfileQuickActionCard(
                icon: Icons.note_add_outlined,
                iconColor: const Color(0xFF0284C7),
                iconBgColor: isDark
                    ? const Color(0xFF142E47)
                    : const Color(0xFFF0F9FF),
                iconBorderColor: isDark
                    ? const Color(0xFF0369A1)
                    : const Color(0xFFBAE6FD),
                title: 'Request Leave',
                subtitle: 'Submit absence form',
                onTap: () => context.push('/leave/request'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ProfileQuickActionCard(
                icon: Icons.history_rounded,
                iconColor: const Color(0xFFF59E0B),
                iconBgColor: isDark
                    ? const Color(0xFF3B2D12)
                    : const Color(0xFFFFFBEB),
                iconBorderColor: isDark
                    ? const Color(0xFFB45309)
                    : const Color(0xFFFDE68A),
                title: 'Leave History',
                subtitle: 'Track approvals',
                onTap: () => context.push('/leave/history'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
