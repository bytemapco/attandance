import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/analytics/providers/leaderboard_provider.dart';

/// Department leaderboard banner matching reference screenshot.
class AnalyticsLeaderboardTile extends ConsumerWidget {
  const AnalyticsLeaderboardTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lbState = ref.watch(leaderboardProvider);
    final userPoints = lbState.data?.userPoints ?? 1200;
    final userRank = lbState.data?.userRank ?? 1;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return InkWell(
      onTap: () => context.push('/leaderboard'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
            width: 1.0,
          ),
        ),
        child: Row(
          children: [
            // Peach circle badge with Trophy icon
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: SasColors.copperSoft,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.emoji_events_rounded,
                  color: SasColors.copperStrong,
                  size: 22,
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Leaderboard info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Department leaderboard',
                    style: SasTypography.style(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      color: primaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Rank #$userRank • $userPoints points',
                    style: SasTypography.style(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: subtitleColor,
                    ),
                  ),
                ],
              ),
            ),

            // Chevron
            Icon(Icons.chevron_right_rounded, color: subtitleColor, size: 20),
          ],
        ),
      ),
    );
  }
}
