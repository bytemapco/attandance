import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/performance_summary.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/features/analytics/widgets/attendance_bar.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';

/// The overall figure, where it stands against the minimum, and what it means in one sentence.
class AnalyticsSummaryCard extends StatelessWidget {
  final StudentAnalytics analytics;

  const AnalyticsSummaryCard({super.key, required this.analytics});

  @override
  Widget build(BuildContext context) {
    final overall = analytics.overall;
    final color = standingColor(overall.standing);
    return SurfaceCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                percentLabel(overall.percentage),
                style: TextStyle(
                  color: color,
                  fontSize: 40,
                  fontWeight: FontWeight.w600,
                  height: 1,
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: _StandingChip(standing: overall.standing),
              ),
            ],
          ),
          const SizedBox(height: 14),
          AttendanceBar(
            percentage: overall.percentage,
            threshold: analytics.threshold,
            color: color,
          ),
          const SizedBox(height: 6),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            spacing: 12,
            children: [
              Text(
                '${overall.attended} of ${overall.conducted} classes',
                style: TextStyle(color: SasColors.textMutedOf(context), fontSize: 12),
              ),
              Text(
                'Minimum ${analytics.threshold.toStringAsFixed(0)}%',
                style: TextStyle(color: SasColors.textMutedOf(context), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            performanceSummary(analytics),
            style: TextStyle(
              color: SasColors.textSecondaryOf(context),
              fontSize: 13.5,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _StandingChip extends StatelessWidget {
  final Standing standing;
  const _StandingChip({required this.standing});

  @override
  Widget build(BuildContext context) {
    final color = standingColor(standing);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: SasRadius.xlAll,
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        standingLabel(standing),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
