import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class HistorySessionTile extends StatefulWidget {
  final AttendanceHistoryItem item;
  const HistorySessionTile({super.key, required this.item});

  @override
  State<HistorySessionTile> createState() => _HistorySessionTileState();
}

class _HistorySessionTileState extends State<HistorySessionTile> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final item = widget.item;
    final hasAiScores = item.finalAiScore != null;
    final itemStatusColor = statusColor(item.status);
    final textSecondary = SasColors.textSecondaryOf(context);
    final textMuted = SasColors.textMutedOf(context);

    return GlassCard(
      padding: const EdgeInsets.all(12),
      onTap: isFlagged(item.status)
          ? () => context.push('/flagged/${item.attendanceId}', extra: item)
          : (hasAiScores ? () => setState(() => _expanded = !_expanded) : null),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: itemStatusColor,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.className,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: SasColors.textPrimaryOf(context),
                      ),
                    ),
                    Text(
                      item.subject,
                      style: TextStyle(color: textSecondary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: itemStatusColor.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: itemStatusColor.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Text(
                      item.status,
                      style: TextStyle(
                        color: itemStatusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    DateFormat.jm().format(item.markedAt),
                    style: TextStyle(color: textMuted, fontSize: 10),
                  ),
                ],
              ),
              if (hasAiScores && item.status != 'Flagged') ...[
                const SizedBox(width: 6),
                Icon(
                  _expanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  size: 16,
                  color: textMuted,
                ),
              ],
              if (item.status == 'Flagged') ...[
                const SizedBox(width: 6),
                Icon(Icons.chevron_right_rounded, size: 16, color: textMuted),
              ],
            ],
          ),
          if (_expanded && hasAiScores) ...[
            const SizedBox(height: 10),
            Divider(
              color: isDark ? const Color(0x2AFFFFFF) : const Color(0xFFE2E8F0),
              height: 1,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _ScoreItem(
                  label: 'Face',
                  score: item.faceScore ?? 0,
                  textMuted: textMuted,
                ),
                _ScoreItem(
                  label: 'Liveness',
                  score: item.livenessScore ?? 0,
                  textMuted: textMuted,
                ),
                _ScoreItem(
                  label: 'Room',
                  score: item.backgroundScore ?? 0,
                  textMuted: textMuted,
                ),
                _ScoreItem(
                  label: 'Score',
                  score: item.finalAiScore ?? 0,
                  textMuted: textMuted,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _ScoreItem extends StatelessWidget {
  final String label;
  final double score;
  final Color textMuted;
  const _ScoreItem({
    required this.label,
    required this.score,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    final color = scoreColor(score);
    return Column(
      children: [
        Text(label, style: TextStyle(color: textMuted, fontSize: 10)),
        const SizedBox(height: 1),
        Text(
          '${(score * 100).toStringAsFixed(0)}%',
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w700,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
