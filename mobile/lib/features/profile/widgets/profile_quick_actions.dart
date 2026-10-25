import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/menu_grid_item.dart';

class ProfileQuickActions extends StatelessWidget {
  final int unreadCount;
  const ProfileQuickActions({super.key, required this.unreadCount});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: MenuGridItem(
                icon: Icons.qr_code_2_rounded,
                label: 'Smart Pass',
                subtitle: 'Campus digital ID',
                iconColor: SasColors.accentEmerald,
                onTap: () => context.push('/smart-pass'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MenuGridItem(
                icon: Icons.notifications_rounded,
                label: 'Notifications',
                subtitle: 'Alerts & updates',
                iconColor: SasColors.warning,
                badgeCount: unreadCount,
                onTap: () => context.push('/notifications'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: MenuGridItem(
                icon: Icons.add_circle_outline_rounded,
                label: 'Request Leave',
                subtitle: 'Submit absence form',
                iconColor: SasColors.info,
                onTap: () => context.push('/leave/request'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MenuGridItem(
                icon: Icons.history_rounded,
                label: 'Leave History',
                subtitle: 'Track approvals',
                iconColor: SasColors.accentTeal,
                onTap: () => context.push('/leave/history'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
