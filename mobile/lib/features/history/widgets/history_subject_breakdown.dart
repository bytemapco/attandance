import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class HistorySubjectBreakdown extends StatelessWidget {
  final List<AttendanceHistoryItem> history;
  const HistorySubjectBreakdown({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    final subjectStats = <String, _SubStat>{};
    for (final item in history) {
      final stat = subjectStats.putIfAbsent(
        item.classId,
        () => _SubStat(name: item.subject, className: item.className),
      );
      stat.total++;
      if (item.status == 'Present' || item.status == 'Approved') {
        stat.present++;
      }
    }
    if (subjectStats.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Course Attendance Rates',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 12,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        ...subjectStats.values.map((stat) {
          final pct =
              stat.total > 0 ? (stat.present / stat.total * 100) : 0.0;
          final color = pct >= 75
              ? SasColors.success
              : (pct >= 50 ? SasColors.warning : SasColors.danger);
          return Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: GlassCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stat.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                            color: SasColors.textPrimary,
                          ),
                        ),
                        Text(
                          stat.className,
                          style: const TextStyle(
                            color: SasColors.textMuted,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${stat.present}/${stat.total}',
                    style: const TextStyle(
                      color: SasColors.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: color.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      '${pct.toStringAsFixed(0)}%',
                      style: TextStyle(
                        color: color,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _SubStat {
  final String name;
  final String className;
  int total = 0;
  int present = 0;
  _SubStat({required this.name, required this.className});
}
