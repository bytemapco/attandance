import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/status_chip.dart';

class ProfileSettingsList extends StatelessWidget {
  final int pendingCount;
  const ProfileSettingsList({super.key, required this.pendingCount});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Settings & Support',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        GlassCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _SettingTile(
                icon: Icons.track_changes_rounded,
                iconColor: SasColors.success,
                title: 'Goals & Targets',
                subtitle: 'Set minimum attendance threshold',
                onTap: () => context.push('/settings/goals'),
              ),
              const Divider(
                height: 1,
                thickness: 1,
                color: SasColors.glassBorder,
                indent: 48,
              ),
              _SettingTile(
                icon: Icons.notifications_rounded,
                iconColor: SasColors.warning,
                title: 'Notification Preferences',
                subtitle: 'Configure class & attendance alerts',
                onTap: () => context.push('/settings/notifications'),
              ),
              const Divider(
                height: 1,
                thickness: 1,
                color: SasColors.glassBorder,
                indent: 48,
              ),
              _SettingTile(
                icon: Icons.cloud_sync_rounded,
                iconColor: SasColors.info,
                title: 'Offline Sync Status',
                subtitle: pendingCount > 0
                    ? '$pendingCount submissions queued'
                    : 'All records synced with server',
                onTap: () => context.push('/settings/sync'),
                trailing: pendingCount > 0
                    ? StatusChip(label: '$pendingCount', color: SasColors.info)
                    : const Icon(
                        Icons.check_circle_rounded,
                        color: SasColors.success,
                        size: 16,
                      ),
              ),
              const Divider(
                height: 1,
                thickness: 1,
                color: SasColors.glassBorder,
                indent: 48,
              ),
              _SettingTile(
                icon: Icons.help_outline_rounded,
                iconColor: SasColors.accentTeal,
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

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color iconColor;

  const _SettingTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
    this.trailing,
    this.iconColor = SasColors.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap != null
            ? () {
                HapticFeedback.selectionClick();
                onTap!();
              }
            : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: SasColors.textPrimary,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: SasColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              trailing ??
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: SasColors.textMuted,
                    size: 16,
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
