import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/leaderboard.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class LeaderboardItemCard extends StatelessWidget {
  final int rank;
  final LeaderboardEntry entry;
  final bool isCurrentUser;

  const LeaderboardItemCard({
    super.key,
    required this.rank,
    required this.entry,
    required this.isCurrentUser,
  });

  @override
  Widget build(BuildContext context) {
    Color itemBorderColor = SasColors.glassBorder;
    if (isCurrentUser) {
      itemBorderColor = SasColors.accentEmerald.withValues(alpha: 0.4);
    } else if (rank == 1) {
      itemBorderColor = SasColors.accentAmber.withValues(alpha: 0.3);
    }

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      borderColor: itemBorderColor,
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: _buildRankBadge(rank),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        entry.name,
                        style: TextStyle(
                          fontWeight:
                              isCurrentUser ? FontWeight.w700 : FontWeight.w600,
                          fontSize: 13,
                          color: isCurrentUser
                              ? SasColors.success
                              : SasColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCurrentUser) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: SasColors.success.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: SasColors.success,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                if (entry.currentStreak > 0) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.bolt_rounded,
                        size: 13,
                        color: SasColors.warning,
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '${entry.currentStreak} day streak',
                        style: const TextStyle(
                          fontSize: 11,
                          color: SasColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '${entry.points} pts',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: rank == 1 ? SasColors.accentAmber : SasColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankBadge(int rank) {
    if (rank == 1) {
      return const Icon(
        Icons.emoji_events_rounded,
        color: SasColors.accentAmber,
        size: 20,
      );
    } else if (rank == 2) {
      return const Icon(
        Icons.emoji_events_rounded,
        color: Color(0xFF94A3B8),
        size: 18,
      );
    } else if (rank == 3) {
      return const Icon(
        Icons.emoji_events_rounded,
        color: Color(0xFFD97706),
        size: 18,
      );
    }

    return Text(
      '#$rank',
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 12,
        color: SasColors.textMuted,
      ),
    );
  }
}
