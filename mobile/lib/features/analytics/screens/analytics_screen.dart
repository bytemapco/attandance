import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_kpi_overview.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_leaderboard_tile.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_subject_goals.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_subject_heatmap.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_weekly_chart.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/settings/providers/preferences_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) {
        final currentHistory = ref.read(historyProvider);
        if (currentHistory.data == null) {
          ref.read(historyProvider.notifier).fetch();
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final hState = ref.watch(historyProvider);
    final prefs = ref.watch(preferencesProvider);
    final target = prefs.attendanceTarget;

    return AnimatedBackground(
      child: SafeArea(
        child: RefreshIndicator(
          color: SasColors.accentEmerald,
          backgroundColor: SasColors.bgSecondary,
          onRefresh: () async {
            await ref.read(historyProvider.notifier).fetch();
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Row(
                children: [
                  Icon(Icons.insights_rounded, color: SasColors.textMuted, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Analytics & Performance',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: SasColors.textPrimary),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (hState.isLoading && hState.data == null)
                const ShimmerPlaceholder(itemCount: 4, itemHeight: 100)
              else if (hState.data == null)
                GlassCard(
                  child: Column(
                    children: [
                      const SizedBox(height: 12),
                      const Icon(Icons.cloud_off_rounded, size: 36, color: SasColors.danger),
                      const SizedBox(height: 10),
                      Text(
                        hState.errorMessage ?? 'Failed to load analytics',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: SasColors.textSecondary, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                )
              else ...[
                AnalyticsKpiOverview(data: hState.data!, target: target),
                const SizedBox(height: 14),
                AnalyticsWeeklyChart(data: hState.data!),
                const SizedBox(height: 14),
                AnalyticsSubjectGoals(data: hState.data!, target: target),
                const SizedBox(height: 14),
                const AnalyticsLeaderboardTile(),
                const SizedBox(height: 14),
                AnalyticsSubjectHeatmap(data: hState.data!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
