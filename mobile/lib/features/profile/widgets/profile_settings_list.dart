import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/profile/widgets/appearance_setting_tile.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_setting_item_row.dart';

/// Grouped settings and support list matching the reference screenshot.
class ProfileSettingsList extends StatelessWidget {
  final int pendingCount;

  const ProfileSettingsList({super.key, required this.pendingCount});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final dividerColor = isDark
        ? const Color(0x1FFFFFFF)
        : const Color(0xFFF1F5F9);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Settings & Support',
          style: SasTypography.style(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: primaryTextColor,
          ),
        ),
        const SizedBox(height: 10),

        Container(
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
          child: Column(
            children: [
              // 1. Appearance (theme toggler modal / sheet)
              const AppearanceSettingTile(),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 2. Goals & Targets
              ProfileSettingItemRow(
                icon: Icons.track_changes_rounded,
                iconColor: const Color(0xFF10B981),
                iconBgColor: isDark
                    ? const Color(0xFF143828)
                    : const Color(0xFFECFDF5),
                title: 'Goals & Targets',
                subtitle: 'Set minimum attendance threshold',
                onTap: () => context.push('/settings/goals'),
              ),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 3. Notification Preferences
              ProfileSettingItemRow(
                icon: Icons.notifications_rounded,
                iconColor: const Color(0xFFF59E0B),
                iconBgColor: isDark
                    ? const Color(0xFF3B2D12)
                    : const Color(0xFFFFFBEB),
                title: 'Notification Preferences',
                subtitle: 'Configure class & attendance alerts',
                onTap: () => context.push('/settings/notifications'),
              ),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 4. Offline Sync Status
              ProfileSettingItemRow(
                icon: Icons.cloud_outlined,
                iconColor: const Color(0xFF0284C7),
                iconBgColor: isDark
                    ? const Color(0xFF142E47)
                    : const Color(0xFFF0F9FF),
                title: 'Offline Sync Status',
                subtitle: pendingCount > 0
                    ? '$pendingCount records queued for sync'
                    : 'All records synced with server',
                trailing: const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF10B981),
                  size: 20,
                ),
                onTap: () => context.push('/settings/sync'),
              ),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 5. Help & FAQ
              ProfileSettingItemRow(
                icon: Icons.help_outline_rounded,
                iconColor: const Color(0xFF8B5CF6),
                iconBgColor: isDark
                    ? const Color(0xFF2E1B4E)
                    : const Color(0xFFF5F3FF),
                title: 'Help & FAQ',
                subtitle: 'Support guide and common questions',
                onTap: () => context.push('/settings/help'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
