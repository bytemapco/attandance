import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';

class ReviewScoreRow extends StatelessWidget {
  final String label;
  final IconData icon;
  final double score;
  final Animation<double> animation;
  final String hint;

  const ReviewScoreRow({
    super.key,
    required this.label,
    required this.icon,
    required this.score,
    required this.animation,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    final color = scoreColor(score);
    return Row(
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Icon(icon, color: color, size: 15),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 76,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  color: SasColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                hint,
                style: TextStyle(
                  fontSize: 10,
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: AnimatedBuilder(
            animation: animation,
            builder: (_, __) => ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (score * animation.value).clamp(0.0, 1.0),
                backgroundColor: SasColors.glassBorder,
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 6,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        AnimatedBuilder(
          animation: animation,
          builder: (_, __) => Text(
            '${(score * 100 * animation.value).toStringAsFixed(0)}%',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}
