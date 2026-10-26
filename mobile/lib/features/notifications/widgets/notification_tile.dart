import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/extensions.dart';
import 'package:smart_attendance_app/domain/models/app_notification.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class NotificationTile extends StatelessWidget {
  final LocalNotification notification;
  final VoidCallback? onMarkRead;
  final VoidCallback? onDelete;

  const NotificationTile({
    super.key,
    required this.notification,
    this.onMarkRead,
    this.onDelete,
  });

  ({IconData icon, Color color}) _getSeverity(String severity) {
    final s = severity.toLowerCase().trim();
    if (s == 'success') {
      return (icon: Icons.check_circle_rounded, color: SasColors.accentEmerald);
    } else if (s == 'warning') {
      return (icon: Icons.warning_amber_rounded, color: SasColors.warning);
    } else if (s == 'danger' || s == 'error') {
      return (icon: Icons.error_outline_rounded, color: SasColors.danger);
    } else {
      return (icon: Icons.info_outline_rounded, color: SasColors.info);
    }
  }

  void _handleTap(BuildContext context) {
    if (onMarkRead != null && !notification.isRead) {
      onMarkRead!();
    }
    if (notification.link != null && notification.link!.isNotEmpty) {
      final link = notification.link!;
      if (link.startsWith('/')) {
        const shellRoutes = {'/home', '/history', '/analytics', '/more'};
        if (shellRoutes.contains(link)) {
          context.go(link);
        } else {
          context.push(link);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sev = _getSeverity(notification.severity);
    final isBroadcast = notification.source == 'broadcast' || notification.category == 'broadcast';

    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete?.call(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        decoration: BoxDecoration(
          color: SasColors.danger.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: SasColors.danger, size: 22),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: InkWell(
          onTap: () => _handleTap(context),
          borderRadius: BorderRadius.circular(12),
          child: GlassCard(
            padding: const EdgeInsets.all(12),
            borderColor: !notification.isRead ? sev.color.withValues(alpha: 0.3) : null,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!notification.isRead)
                  Container(
                    width: 3.5,
                    height: 40,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: sev.color,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: sev.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(sev.icon, size: 18, color: sev.color),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w700,
                                fontSize: 13,
                                color: SasColors.textPrimary,
                              ),
                            ),
                          ),
                          if (isBroadcast)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: SasColors.accentEmerald.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text('BROADCAST', style: TextStyle(color: SasColors.accentEmerald, fontSize: 9, fontWeight: FontWeight.w700)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(notification.body, style: const TextStyle(color: SasColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(notification.timestamp.formattedDateTime, style: const TextStyle(color: SasColors.textMuted, fontSize: 10)),
                          if (notification.link != null && notification.link!.isNotEmpty)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('View details', style: TextStyle(color: sev.color, fontSize: 10, fontWeight: FontWeight.w600)),
                                const SizedBox(width: 2),
                                Icon(Icons.arrow_forward_ios_rounded, size: 9, color: sev.color),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
