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
        ? SasColors.ivory
        : SasColors.ink;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: SasTypography.style(
            fontSize: 15,
            fontWeight: FontWeight.w600,
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
                iconColor: SasColors.copperStrong,
                iconBgColor: isDark
                    ? SasColors.darkWarningSoft
                    : SasColors.copperSoft,
                iconBorderColor: isDark
                    ? SasColors.copperStrong
                    : SasColors.copperSoft,
                title: 'Smart Pass',
                subtitle: 'Campus digital ID',
                onTap: () => context.push('/smart-pass'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ProfileQuickActionCard(
                icon: Icons.notifications_none_rounded,
                iconColor: SasColors.danger,
                iconBgColor: isDark
                    ? SasColors.darkDangerSoft
                    : SasColors.dangerSoft,
                iconBorderColor: isDark
                    ? SasColors.danger
                    : SasColors.dangerBorder,
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
                iconColor: SasColors.info,
                iconBgColor: isDark
                    ? SasColors.darkInfoSoft
                    : SasColors.infoSoft,
                iconBorderColor: isDark
                    ? SasColors.info
                    : SasColors.infoBorder,
                title: 'Request Leave',
                subtitle: 'Submit absence form',
                onTap: () => context.push('/leave/request'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ProfileQuickActionCard(
                icon: Icons.history_rounded,
                iconColor: SasColors.warning,
                iconBgColor: isDark
                    ? SasColors.darkWarningSoft
                    : SasColors.warningSoft,
                iconBorderColor: isDark
                    ? SasColors.warning
                    : SasColors.warningBorder,
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
