import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/data/local/pending_count_provider.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_header_card.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_quick_actions.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_settings_list.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final pendingCount = ref.watch(pendingCountProvider);
    final profile = user?.studentProfile;
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return AnimatedBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ProfileHeaderCard(user: user, profile: profile),
            const SizedBox(height: 16),
            ProfileQuickActions(unreadCount: unreadCount),
            const SizedBox(height: 16),
            ProfileSettingsList(pendingCount: pendingCount),
            const SizedBox(height: 20),
            GlassButton(
              label: 'Sign Out',
              variant: GlassButtonVariant.danger,
              isExpanded: true,
              icon: Icons.logout_rounded,
              onPressed: () => _confirmLogout(context, ref),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: SasColors.bgSecondary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: SasColors.glassBorder),
        ),
        title: const Text(
          'Sign Out?',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
        content: const Text(
          'You will need to re-authenticate with your university credentials to access the app.',
          style: TextStyle(color: SasColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text(
              'Cancel',
              style: TextStyle(color: SasColors.textMuted),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authProvider.notifier).logout();
            },
            child: const Text(
              'Sign Out',
              style: TextStyle(
                color: SasColors.danger,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
