import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class AnalyticsSubjectGoals extends StatelessWidget {
  final AttendanceHistoryResponse data;
  final double target;

  const AnalyticsSubjectGoals({
    super.key,
    required this.data,
    required this.target,
  });

  @override
  Widget build(BuildContext context) {
    final subjectStats = <String, _GoalStat>{};
    for (final item in data.history) {
      final stat = subjectStats.putIfAbsent(
        item.classId,
        () => _GoalStat(subject: item.subject, className: item.className),
      );
      stat.total++;
      if (isPresentOrApproved(item.status)) {
        stat.present++;
      }
    }

    if (subjectStats.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Course Targets & Quotas',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        ...subjectStats.entries.map((entry) {
          final stat = entry.value;
          final pct =
              stat.total > 0 ? (stat.present / stat.total * 100) : 0.0;
          final color = pctColor(pct);

          final needs = computeAttendanceNeeds(
            present: stat.present,
            total: stat.total,
            target: target,
          );

          return Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: GlassCard(
              padding: const EdgeInsets.all(12),
              onTap: () => context.push('/subject/${entry.key}'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stat.subject,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                                color: SasColors.textPrimary,
                              ),
                            ),
                            Text(
                              stat.className,
                              style: const TextStyle(
                                color: SasColors.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${pct.toStringAsFixed(0)}%',
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: (pct / 100).clamp(0.0, 1.0),
                      backgroundColor: SasColors.bgSurface,
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                      minHeight: 5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${stat.present}/${stat.total} sessions',
                        style: const TextStyle(
                          color: SasColors.textMuted,
                          fontSize: 10,
                        ),
                      ),
                      if (pct >= target)
                        Text(
                          needs.canMiss > 0
                              ? 'Can miss ${needs.canMiss} more'
                              : 'At target',
                          style: const TextStyle(
                            color: SasColors.success,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        )
                      else
                        Text(
                          'Need ${needs.needToAttend} more for ${target.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            color: SasColors.warning,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
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

class _GoalStat {
  final String subject;
  final String className;
  int total = 0;
  int present = 0;
  _GoalStat({required this.subject, required this.className});
}
