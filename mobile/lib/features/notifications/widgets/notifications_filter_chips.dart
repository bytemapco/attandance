import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';

class NotificationsFilterChips extends StatelessWidget {
  final List<LocalNotification> notifications;
  final String selectedFilter;
  final ValueChanged<String> onSelected;

  const NotificationsFilterChips({
    super.key,
    required this.notifications,
    required this.selectedFilter,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final broadcastCount = notifications
        .where((n) => n.source == 'broadcast' || n.category == 'broadcast')
        .length;
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          _buildFilterChip(context, 'all', 'All (${notifications.length})'),
          const SizedBox(width: 8),
          _buildFilterChip(context, 'broadcasts', 'Broadcasts ($broadcastCount)'),
          const SizedBox(width: 8),
          _buildFilterChip(context, 'unread', 'Unread ($unreadCount)'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, String key, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSelected = selectedFilter == key;
    return InkWell(
      onTap: () => onSelected(key),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? SasColors.accentEmerald
              : (isDark ? SasColors.darkSurface : SasColors.bgSecondary),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? SasColors.accentEmerald
                : (isDark ? const Color(0x2AFFFFFF) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected
                ? Colors.white
                : SasColors.textSecondaryOf(context),
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
