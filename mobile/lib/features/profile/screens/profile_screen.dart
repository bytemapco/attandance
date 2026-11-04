import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/data/local/pending_count_provider.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_header_card.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_quick_actions.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_settings_list.dart';
import 'package:smart_attendance_app/features/profile/widgets/profile_sign_out_dialog.dart';
import 'package:smart_attendance_app/shared/widgets/screen_background.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider.select((s) => s.user));
    final pendingCount = ref.watch(pendingCountProvider);
    final profile = user?.studentProfile;
    final unreadCount = ref.watch(
      notificationsProvider.select(
        (list) => list.where((n) => !n.isRead).length,
      ),
    );
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;

    return ScreenBackground(
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: SmartPullToRefresh(
              onRefresh: () async {
                await ref.read(authProvider.notifier).checkInitialAuth();
                ref.read(pendingCountProvider.notifier).refresh();
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                children: [
                  // Page header: "Profile" + Settings Gear Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        'Profile',
                        style: SasTypography.style(
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                          color: primaryTextColor,
                        ),
                      ),
                      InkWell(
                        onTap: () => context.push('/settings/goals'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: isDark
                                ? SasColors.darkSurface
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? SasColors.darkBorder
                                  : SasColors.textOnDark,
                              width: 1.0,
                            ),
                          ),
                          child: Icon(
                            Icons.settings_outlined,
                            size: 20,
                            color: primaryTextColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // 1. User Identity Card
                  ProfileHeaderCard(user: user, profile: profile),
                  const SizedBox(height: 14),

                  // 2. Quick Actions 2x2 Grid
                  ProfileQuickActions(unreadCount: unreadCount),
                  const SizedBox(height: 14),

                  // 3. Settings & Support Grouped Card
                  ProfileSettingsList(pendingCount: pendingCount),
                  const SizedBox(height: 20),

                  // 4. Soft Red Sign Out Button
                  InkWell(
                    onTap: () => showSignOutDialog(
                      context,
                      onConfirm: () => ref.read(authProvider.notifier).logout(),
                    ),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: isDark
                            ? SasColors.darkDangerSoft
                            : SasColors.dangerSoft,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? SasColors.danger
                              : SasColors.dangerBorder,
                          width: 1.0,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.logout_rounded,
                            color: SasColors.danger,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Sign Out',
                            style: SasTypography.style(
                              color: SasColors.danger,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
