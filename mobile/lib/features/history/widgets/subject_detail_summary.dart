import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SubjectDetailSummary extends StatelessWidget {
  final String subjectName;
  final String className;
  final List<AttendanceHistoryItem> items;
  final double target;

  const SubjectDetailSummary({
    super.key,
    required this.subjectName,
    required this.className,
    required this.items,
    required this.target,
  });

  @override
  Widget build(BuildContext context) {
    final total = items.length;
    final present = countPresentOrApproved(items);
    final absent = countAbsent(items);
    final flagged = countFlagged(items);
    final pct = computeSubjectPct(present, total);
    final color = pctColor(pct);
    final needs = computeAttendanceNeeds(
      present: present,
      total: total,
      target: target,
    );

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subjectName,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: SasColors.textPrimary),
          ),
          if (className.isNotEmpty)
            Text(className, style: const TextStyle(color: SasColors.textMuted, fontSize: 12)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _buildMiniStat('Present', '$present', SasColors.accentEmerald)),
              const SizedBox(width: 8),
              Expanded(child: _buildMiniStat('Absent', '$absent', SasColors.danger)),
              const SizedBox(width: 8),
              Expanded(child: _buildMiniStat('Flagged', '$flagged', SasColors.warning)),
              const SizedBox(width: 8),
              Expanded(child: _buildMiniStat('Total', '$total', SasColors.info)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Attendance Rate', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text('${pct.toStringAsFixed(1)}%',
                  style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (pct / 100).clamp(0.0, 1.0),
              backgroundColor: SasColors.glassBorder,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            pct >= target
                ? (needs.canMiss > 0
                    ? 'You can miss ${needs.canMiss} more sessions and maintain ${target.toStringAsFixed(0)}%'
                    : 'You are meeting your attendance target.')
                : 'Attend ${needs.needToAttend} more sessions to reach ${target.toStringAsFixed(0)}%',
            style: TextStyle(
              color: pct >= target ? SasColors.accentEmerald : SasColors.warning,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 16)),
          Text(label, style: const TextStyle(color: SasColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
