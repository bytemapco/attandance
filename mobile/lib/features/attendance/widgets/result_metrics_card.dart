import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class ResultMetricsCard extends StatelessWidget {
  final ScoreData scores;

  const ResultMetricsCard({super.key, required this.scores});

  @override
  Widget build(BuildContext context) {
    final overallCol = scoreColor(scores.overall);

    return GlassCard(
      borderColor: overallCol.withValues(alpha: 0.25),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: overallCol.withValues(alpha: 0.1),
                ),
                child: Center(
                  child: Text(
                    '${(scores.overall * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      color: overallCol,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Aggregate AI Confidence',
                        style: TextStyle(color: SasColors.textMuted, fontSize: 11, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(
                      scores.overall >= 0.7 ? 'Strong Validation Match' : 'Borderline Score Recorded',
                      style: TextStyle(color: overallCol, fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(color: SasColors.glassBorder, height: 20),
          Row(
            children: [
              Expanded(child: _buildItem('Face Match', scores.face)),
              Container(width: 1, height: 28, color: SasColors.glassBorder),
              Expanded(child: _buildItem('Liveness', scores.liveness)),
              Container(width: 1, height: 28, color: SasColors.glassBorder),
              Expanded(child: _buildItem('Environment', scores.background)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItem(String label, double score) {
    final col = scoreColor(score);
    return Column(
      children: [
        Text(
          '${(score * 100).toStringAsFixed(0)}%',
          style: TextStyle(color: col, fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(color: SasColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
