import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/domain/models/leave_request.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class LeaveHistoryTile extends StatelessWidget {
  final LeaveRequest leave;

  const LeaveHistoryTile({super.key, required this.leave});

  Color _statusColor(String status) {
    if (status == kStatusApprovedUpper || status == 'APPROVED') return SasColors.accentEmerald;
    if (status == kStatusRejected || status == 'REJECTED') return SasColors.danger;
    return SasColors.warning;
  }

  @override
  Widget build(BuildContext context) {
    final statusCol = _statusColor(leave.status);
    final days = leave.endDate.difference(leave.startDate).inDays + 1;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    leave.reason,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: SasColors.textPrimary,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusCol.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: statusCol.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    leave.status,
                    style: TextStyle(
                      color: statusCol,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today_rounded, size: 12, color: SasColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  '${DateFormat('MMM d').format(leave.startDate)} – ${DateFormat('MMM d, yyyy').format(leave.endDate)}',
                  style: const TextStyle(color: SasColors.textMuted, fontSize: 12),
                ),
                const SizedBox(width: 8),
                Text(
                  '($days ${days == 1 ? 'day' : 'days'})',
                  style: const TextStyle(
                    color: SasColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            if (leave.approverNote != null && leave.approverNote!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: SasColors.bgCanvas,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: SasColors.glassBorder),
                ),
                child: Text(
                  'Note: ${leave.approverNote}',
                  style: const TextStyle(color: SasColors.textSecondary, fontSize: 11),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
