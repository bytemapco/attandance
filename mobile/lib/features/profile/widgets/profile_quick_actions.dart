import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
              child: _QuickActionCard(
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
              child: _QuickActionCard(
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
              child: _QuickActionCard(
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
              child: _QuickActionCard(
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

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final Color iconBorderColor;
  final String title;
  final String subtitle;
  final int? badgeCount;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.iconBorderColor,
    required this.title,
    required this.subtitle,
    this.badgeCount,
    required this.onTap,
  });

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

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top icon & optional badge / chevron
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Icon squircle
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: iconBorderColor, width: 1.0),
                  ),
                  child: Center(child: Icon(icon, color: iconColor, size: 20)),
                ),

                // Trailing: Badge + Chevron
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (badgeCount != null && badgeCount! > 0) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$badgeCount',
                          style: SasTypography.style(
                            color: Colors.white,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                    ],
                    Icon(
                      Icons.chevron_right_rounded,
                      color: subtitleColor,
                      size: 18,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Title & Subtitle
            Text(
              title,
              style: SasTypography.style(
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
                color: primaryTextColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: SasTypography.style(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: subtitleColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
