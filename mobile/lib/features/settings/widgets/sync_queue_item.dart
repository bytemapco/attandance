import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/offline_payload.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SyncQueueItem extends StatelessWidget {
  final OfflineAttendancePayload payload;

  const SyncQueueItem({super.key, required this.payload});

  String _formatAge(Duration age) {
    if (age.inMinutes < 1) return 'just now';
    if (age.inMinutes < 60) return '${age.inMinutes}m ago';
    return '${age.inHours}h ${age.inMinutes % 60}m ago';
  }

  @override
  Widget build(BuildContext context) {
    final age = DateTime.now().difference(payload.capturedAt);
    final isExpiringSoon = age.inMinutes > 90;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.all(12),
        borderColor: isExpiringSoon ? SasColors.warning.withValues(alpha: 0.3) : null,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: SasColors.info.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.pending_rounded, color: SasColors.info, size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payload.className ?? 'Class Session',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: SasColors.textPrimary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${DateFormat.jm().format(payload.capturedAt)} · ${_formatAge(age)}',
                    style: const TextStyle(color: SasColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
            if (isExpiringSoon)
              const Icon(Icons.warning_amber_rounded, color: SasColors.warning, size: 16),
          ],
        ),
      ),
    );
  }
}
