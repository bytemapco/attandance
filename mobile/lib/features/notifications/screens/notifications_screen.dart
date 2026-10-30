import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notification_tile.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notifications_empty_view.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notifications_filter_chips.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';

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
      appBar: GlassAppBar(
        title: 'Notifications',
        actions: [
          if (notifications.isNotEmpty) ...[
            IconButton(
              icon: const Icon(
                Icons.done_all_rounded,
                color: SasColors.textMuted,
                size: 20,
              ),
              onPressed: () =>
                  ref.read(notificationsProvider.notifier).markAllRead(),
              tooltip: 'Mark All Read',
            ),
            IconButton(
              icon: const Icon(
                Icons.clear_all_rounded,
                color: SasColors.textMuted,
                size: 20,
              ),
              onPressed: () => ref.read(notificationsProvider.notifier).clear(),
              tooltip: 'Clear All',
            ),
            if (unread > 0)
              Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: SasColors.accentEmerald.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: SasColors.accentEmerald.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  '$unread',
                  style: const TextStyle(
                    color: SasColors.accentEmerald,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
          ],
        ],
      ),
      body: AnimatedBackground(
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
                      color: SasColors.accentEmerald,
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
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(32),
                                child: CircularProgressIndicator(
                                  color: SasColors.accentEmerald,
                                ),
                              ),
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
