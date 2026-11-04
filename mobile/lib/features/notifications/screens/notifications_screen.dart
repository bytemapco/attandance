import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notification_tile.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notifications_empty_view.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notifications_filter_chips.dart';
import 'package:smart_attendance_app/shared/widgets/screen_background.dart';
import 'package:smart_attendance_app/shared/widgets/app_top_bar.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationsProvider);
    final isLoading = ref.watch(notificationsLoadingProvider);
    final unread = notifications.where((n) => !n.isRead).length;

    final filtered = notifications.where((n) {
      if (_selectedFilter == 'broadcasts') {
        return n.source == 'broadcast' || n.category == 'broadcast';
      }
      if (_selectedFilter == 'unread') {
        return !n.isRead;
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppTopBar(
        title: 'Notifications',
        actions: [
          if (notifications.isNotEmpty) ...[
            IconButton(
              tooltip: 'Mark all as read',
              icon: const Icon(
                Icons.done_all_rounded,
                color: SasColors.textMuted,
                size: 20,
              ),
              onPressed: () =>
                  ref.read(notificationsProvider.notifier).markAllRead(),
            ),
            IconButton(
              tooltip: 'Clear all notifications',
              icon: const Icon(
                Icons.clear_all_rounded,
                color: SasColors.textMuted,
                size: 20,
              ),
              onPressed: () => ref.read(notificationsProvider.notifier).clear(),
            ),
            if (unread > 0)
              Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: SasColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: SasColors.success.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  '$unread',
                  style: const TextStyle(
                    color: SasColors.success,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ],
      ),
      body: ScreenBackground(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Column(
                children: [
                  NotificationsFilterChips(
                    notifications: notifications,
                    selectedFilter: _selectedFilter,
                    onSelected: (filter) =>
                        setState(() => _selectedFilter = filter),
                  ),
                  Expanded(
                    child: RefreshIndicator(
                      color: SasColors.success,
                      backgroundColor:
                          Theme.of(context).brightness == Brightness.dark
                          ? SasColors.darkSurface
                          : SasColors.bgSecondary,
                      onRefresh: () =>
                          ref.read(notificationsProvider.notifier).load(),
                      child: ListView(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        children: [
                          if (isLoading && notifications.isEmpty)
                            const ShimmerPlaceholder(
                              itemCount: 5,
                              itemHeight: 76,
                            )
                          else if (filtered.isEmpty)
                            const NotificationsEmptyView()
                          else
                            ...filtered.map(
                              (n) => NotificationTile(
                                notification: n,
                                onMarkRead: () => ref
                                    .read(notificationsProvider.notifier)
                                    .markRead(n.id),
                                onDelete: () => ref
                                    .read(notificationsProvider.notifier)
                                    .deleteNotification(n.id),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
