import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SubjectSessionRow extends StatelessWidget {
  final AttendanceHistoryItem item;

  const SubjectSessionRow({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final color = statusColor(item.status);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        onTap: item.status == 'Flagged'
            ? () => context.push('/flagged/${item.attendanceId}', extra: item)
            : null,
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(shape: BoxShape.circle, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    DateFormat('EEE, MMM d, yyyy').format(item.markedAt),
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: SasColors.textPrimary),
                  ),
                  Text(
                    DateFormat.jm().format(item.markedAt),
                    style: const TextStyle(color: SasColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
            if (item.finalAiScore != null)
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: SasColors.bgCanvas,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: SasColors.glassBorder),
                ),
                child: Text(
                  '${(item.finalAiScore! * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(color: SasColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: color.withValues(alpha: 0.3)),
              ),
              child: Text(
                item.status,
                style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
            if (isFlagged(item.status)) ...[
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded, color: SasColors.textMuted, size: 16),
            ],
          ],
        ),
      ),
    );
  }
}
