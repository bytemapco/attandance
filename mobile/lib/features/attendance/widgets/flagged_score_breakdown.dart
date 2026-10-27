import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class FlaggedScoreBreakdown extends StatelessWidget {
  final AttendanceHistoryItem item;

  const FlaggedScoreBreakdown({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    if (item.finalAiScore == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verification Metrics',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildBar(context, 'Face Match', item.faceScore ?? 0, 'Face similarity with your profile.'),
              const SizedBox(height: 12),
              _buildBar(context, 'Liveness Check', item.livenessScore ?? 0, 'Checks for a live photo instead of a screen.'),
              const SizedBox(height: 12),
              _buildBar(context, 'Location & Room', item.backgroundScore ?? 0, 'Classroom environment match.'),
              const Divider(color: SasColors.glassBorder, height: 20),
              _buildBar(context, 'Overall Score', item.finalAiScore ?? 0, 'Combined verification score.', isFinal: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBar(BuildContext context, String label, double score, String hint, {bool isFinal = false}) {
    final color = scoreColor(score);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontWeight: isFinal ? FontWeight.w700 : FontWeight.w600,
                fontSize: isFinal ? 13 : 12,
                color: isFinal ? SasColors.textPrimaryOf(context) : SasColors.textSecondary,
              ),
            ),
            Text(
              '${(score * 100).toStringAsFixed(0)}%',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w700,
                fontSize: isFinal ? 15 : 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: score.clamp(0.0, 1.0),
            backgroundColor: SasColors.glassBorder,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: isFinal ? 6 : 4,
          ),
        ),
        const SizedBox(height: 3),
        Text(hint, style: const TextStyle(color: SasColors.textMuted, fontSize: 11)),
      ],
    );
  }
}
