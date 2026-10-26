import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/domain/models/leave_request.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class LeaveHistoryStats extends StatelessWidget {
  final List<LeaveRequest> leaves;

  const LeaveHistoryStats({super.key, required this.leaves});

  @override
  Widget build(BuildContext context) {
    final pending = leaves.where((l) => l.status == kStatusPending || l.status == 'PENDING').length;
    final approved = leaves.where((l) => l.status == kStatusApprovedUpper || l.status == 'APPROVED').length;
    final rejected = leaves.where((l) => l.status == kStatusRejected || l.status == 'REJECTED').length;

    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      child: Row(
        children: [
          Expanded(child: _buildItem('Pending', pending, SasColors.warning)),
          Container(width: 1, height: 32, color: SasColors.glassBorder),
          Expanded(child: _buildItem('Approved', approved, SasColors.accentEmerald)),
          Container(width: 1, height: 32, color: SasColors.glassBorder),
          Expanded(child: _buildItem('Rejected', rejected, SasColors.danger)),
        ],
      ),
    );
  }

  Widget _buildItem(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          '$count',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: SasColors.textMuted,
          ),
        ),
      ],
    );
  }
}
