import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/leaderboard.dart';
import 'package:smart_attendance_app/features/analytics/providers/leaderboard_provider.dart';
import 'package:smart_attendance_app/features/analytics/widgets/leaderboard_item_card.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(leaderboardProvider);
    final currentStudentId = ref.watch(authProvider).user?.studentProfile?.id;

    return Scaffold(
      appBar: const GlassAppBar(
        title: 'Department Leaderboard',
        showBack: true,
      ),
      body: AnimatedBackground(
        child: RefreshIndicator(
          color: SasColors.accentEmerald,
          backgroundColor: SasColors.bgSurface,
          onRefresh: () => ref.read(leaderboardProvider.notifier).fetch(),
          child: _buildBody(context, state, currentStudentId),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    LeaderboardState state,
    String? currentStudentId,
  ) {
    if (state.isLoading && state.data == null) {
      return const Center(
        child: CircularProgressIndicator(color: SasColors.accentEmerald),
      );
    }

    if (state.errorMessage != null && state.data == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: SasColors.danger,
                size: 40,
              ),
              const SizedBox(height: 12),
              Text(
                state.errorMessage!,
                style: const TextStyle(
                  color: SasColors.textSecondary,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final response = state.data;
    if (response == null || response.leaderboard.isEmpty) {
      return const Center(
        child: Text(
          'No leaderboard rankings available.',
          style: TextStyle(color: SasColors.textMuted, fontSize: 13),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        _buildUserSummaryCard(response),
        const SizedBox(height: 16),
        const Text(
          'TOP PERFORMERS',
          style: TextStyle(
            color: SasColors.textMuted,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 8),
        ...response.leaderboard.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isCurrentUser = item.studentId == currentStudentId;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: LeaderboardItemCard(
              rank: index + 1,
              entry: item,
              isCurrentUser: isCurrentUser,
            ),
          );
        }),
      ],
    );
  }

  Widget _buildUserSummaryCard(LeaderboardResponse response) {
    final rankText =
        response.userRank != null ? '#${response.userRank}' : 'N/A';

    return GlassCard(
      borderColor: SasColors.accentAmber.withValues(alpha: 0.3),
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Column(
            children: [
              const Text(
                'YOUR RANK',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: SasColors.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                rankText,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: SasColors.accentAmber,
                ),
              ),
            ],
          ),
          Container(
            height: 36,
            width: 1,
            color: SasColors.glassBorder,
          ),
          Column(
            children: [
              const Text(
                'TOTAL POINTS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: SasColors.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${response.userPoints}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: SasColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
