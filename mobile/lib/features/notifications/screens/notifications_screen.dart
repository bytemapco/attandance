import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/features/notifications/widgets/notification_tile.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationsProvider);
    final isLoading = ref.watch(notificationsLoadingProvider);
    final unread = notifications.where((n) => !n.isRead).length;

    final filtered = notifications.where((n) {
      if (_selectedFilter == 'broadcasts') return n.source == 'broadcast' || n.category == 'broadcast';
      if (_selectedFilter == 'unread') return !n.isRead;
      return true;
    }).toList();

    return Scaffold(
      appBar: GlassAppBar(
        title: 'Notifications',
        actions: [
          if (notifications.isNotEmpty) ...[
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: SasColors.textMuted, size: 20),
              onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
              tooltip: 'Mark All Read',
            ),
            IconButton(
              icon: const Icon(Icons.clear_all_rounded, color: SasColors.textMuted, size: 20),
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
                  border: Border.all(color: SasColors.accentEmerald.withValues(alpha: 0.3)),
                ),
                child: Text('$unread', style: const TextStyle(color: SasColors.accentEmerald, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
          ],
        ],
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: Column(
            children: [
              _buildFilterChips(notifications),
              Expanded(
                child: RefreshIndicator(
                  color: SasColors.accentEmerald,
                  backgroundColor: SasColors.bgSecondary,
                  onRefresh: () => ref.read(notificationsProvider.notifier).load(),
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    children: [
                      if (isLoading && notifications.isEmpty)
                        const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: SasColors.accentEmerald)))
                      else if (filtered.isEmpty)
                        _buildEmpty()
                      else
                        ...filtered.map((n) => NotificationTile(
                              notification: n,
                              onMarkRead: () => ref.read(notificationsProvider.notifier).markRead(n.id),
                              onDelete: () => ref.read(notificationsProvider.notifier).deleteNotification(n.id),
                            )),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips(List<LocalNotification> all) {
    final broadcastCount = all.where((n) => n.source == 'broadcast' || n.category == 'broadcast').length;
    final unreadCount = all.where((n) => !n.isRead).length;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          _buildFilterChip('all', 'All (${all.length})'),
          const SizedBox(width: 8),
          _buildFilterChip('broadcasts', 'Broadcasts ($broadcastCount)'),
          const SizedBox(width: 8),
          _buildFilterChip('unread', 'Unread ($unreadCount)'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _selectedFilter == key;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = key),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? SasColors.accentEmerald : SasColors.bgSecondary,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? SasColors.accentEmerald : SasColors.glassBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : SasColors.textSecondary,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return const GlassCard(
      padding: EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(Icons.notifications_none_rounded, size: 44, color: SasColors.textMuted),
          SizedBox(height: 10),
          Text('No notifications', style: TextStyle(color: SasColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
          SizedBox(height: 4),
          Text('Broadcast announcements and classroom alerts will appear here.',
              textAlign: TextAlign.center, style: TextStyle(color: SasColors.textMuted, fontSize: 12)),
        ],
      ),
    );
  }
}
