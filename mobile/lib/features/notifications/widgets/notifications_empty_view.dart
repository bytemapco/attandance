import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class NotificationsEmptyView extends StatelessWidget {
  const NotificationsEmptyView({super.key});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(
            Icons.notifications_none_rounded,
            size: 44,
            color: SasColors.textMutedOf(context),
          ),
          const SizedBox(height: 10),
          Text(
            'No notifications',
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Broadcast announcements and classroom alerts will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: SasColors.textMutedOf(context),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
