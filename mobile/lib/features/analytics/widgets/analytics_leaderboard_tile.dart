import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/analytics/providers/leaderboard_provider.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class AnalyticsLeaderboardTile extends ConsumerWidget {
  const AnalyticsLeaderboardTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lbState = ref.watch(leaderboardProvider);
    final userPoints = lbState.data?.userPoints ?? 0;
    final userRank = lbState.data?.userRank;

    return GlassCard(
      onTap: () => context.push('/leaderboard'),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: SasColors.accentAmber.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.emoji_events_rounded,
              color: SasColors.accentAmber,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Department Leaderboard',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: SasColors.textPrimary,
                  ),
                ),
                Text(
                  userRank != null
                      ? 'Standing: Rank #$userRank · $userPoints points'
                      : '$userPoints points · View standings',
                  style: const TextStyle(
                    fontSize: 11,
                    color: SasColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            color: SasColors.textMuted,
            size: 18,
          ),
        ],
      ),
    );
  }
}
