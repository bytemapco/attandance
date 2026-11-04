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
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final dividerColor = isDark
        ? SasColors.darkBorder
        : SasColors.ivory;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Settings & Support',
          style: SasTypography.style(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: primaryTextColor,
          ),
        ),
        const SizedBox(height: 10),

        Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
              width: 1.0,
            ),
          ),
          child: Column(
            children: [
              // 1. Appearance (theme toggler modal / sheet)
              const AppearanceSettingTile(),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 2. Goals & Targets
              ProfileSettingItemRow(
                icon: Icons.track_changes_rounded,
                iconColor: SasColors.success,
                iconBgColor: isDark
                    ? SasColors.darkSuccessSoft
                    : SasColors.successSoft,
                title: 'Goals & Targets',
                subtitle: 'Set minimum attendance threshold',
                onTap: () => context.push('/settings/goals'),
              ),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 3. Notification Preferences
              ProfileSettingItemRow(
                icon: Icons.notifications_rounded,
                iconColor: SasColors.warning,
                iconBgColor: isDark
                    ? SasColors.darkWarningSoft
                    : SasColors.warningSoft,
                title: 'Notification Preferences',
                subtitle: 'Configure class & attendance alerts',
                onTap: () => context.push('/settings/notifications'),
              ),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 4. Offline Sync Status
              ProfileSettingItemRow(
                icon: Icons.cloud_outlined,
                iconColor: SasColors.info,
                iconBgColor: isDark
                    ? SasColors.darkInfoSoft
                    : SasColors.infoSoft,
                title: 'Offline Sync Status',
                subtitle: pendingCount > 0
                    ? '$pendingCount records queued for sync'
                    : 'All records synced with server',
                trailing: const Icon(
                  Icons.check_circle_rounded,
                  color: SasColors.success,
                  size: 20,
                ),
                onTap: () => context.push('/settings/sync'),
              ),
              Divider(height: 1, thickness: 1, color: dividerColor, indent: 56),

              // 5. Help & FAQ
              ProfileSettingItemRow(
                icon: Icons.help_outline_rounded,
                iconColor: SasColors.info,
                iconBgColor: isDark
                    ? SasColors.darkInfoSoft
                    : SasColors.infoSoft,
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
