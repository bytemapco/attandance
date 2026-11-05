import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/performance_summary.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/features/analytics/widgets/attendance_bar.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';

/// One subject's percentage, how many classes that is, and what the student can do about it.
class SubjectFiguresCard extends StatelessWidget {
  final SubjectFigures subject;
  final double threshold;
  final VoidCallback? onTap;

  const SubjectFiguresCard({
    super.key,
    required this.subject,
    required this.threshold,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final figures = subject.figures;
    final color = standingColor(figures.standing);
    final advice = subjectAdvice(figures);
    final muted = SasColors.textMutedOf(context);
    return Semantics(
      button: onTap != null,
      label:
          '${subject.subjectName}, ${percentLabel(figures.percentage)}, '
          '${figures.attended} of ${figures.conducted} classes, ${standingLabel(figures.standing)}',
      excludeSemantics: true,
      child: SurfaceCard(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subject.subjectName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: SasColors.textPrimaryOf(context),
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        [
                          subject.subjectCode,
                          if (subject.teacherName != null) subject.teacherName!,
                        ].join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: muted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  percentLabel(figures.percentage),
                  style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),
            AttendanceBar(
              percentage: figures.percentage,
              threshold: threshold,
              color: color,
              height: 6,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  '${figures.attended} of ${figures.conducted} classes',
                  style: TextStyle(color: muted, fontSize: 12),
                ),
                const Spacer(),
                if (advice != null)
                  Flexible(
                    child: Text(
                      advice,
                      textAlign: TextAlign.end,
                      style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
