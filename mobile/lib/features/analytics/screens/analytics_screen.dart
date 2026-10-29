import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_course_progress_card.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_header.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_heatmap_card.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_kpi_row.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_leaderboard_tile.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_rate_card.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_weekly_chart.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/settings/providers/preferences_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final history = hState.data?.history ?? [];
    final total = history.length;
    final present = countPresentOrApproved(history);
    final absent = countAbsent(history);
    final flagged = countFlagged(history);

    final pct = hState.data?.overallAttendancePercentage ?? 0.0;
    final pctClean = (pct.isNaN || pct.isInfinite) ? 0.0 : pct;

    return AnimatedBackground(
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: SmartPullToRefresh(
              onRefresh: () async {
                await ref.read(historyProvider.notifier).fetch();
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                children: [
                  // Screen Header ("Performance" & "Last 4 weeks" dropdown pill)
                  const AnalyticsHeader(),
                  const SizedBox(height: 16),

                  if (hState.isLoading && hState.data == null)
                    const ShimmerPlaceholder(itemCount: 4, itemHeight: 110)
                  else if (hState.errorMessage != null && hState.data == null)
                    _buildErrorCard(hState.errorMessage!, isDark)
                  else ...[
                    // 1. Overall Attendance Rate Card (Circular gauge + Target alert)
                    AnalyticsRateCard(percentage: pctClean, target: target),
                    const SizedBox(height: 14),

                    // 2. Pastel KPI Metrics Row (Total, Present, Absent, Flagged)
                    AnalyticsKpiRow(
                      total: total,
                      present: present,
                      absent: absent,
                      flagged: flagged,
                    ),
                    const SizedBox(height: 14),

                    // 3. Weekly Attendance Bar Chart
                    if (hState.data != null)
                      AnalyticsWeeklyChart(data: hState.data!),
                    const SizedBox(height: 14),

                    // 4. Course Progress Card
                    if (hState.data != null)
                      AnalyticsCourseProgressCard(
                        data: hState.data!,
                        target: target,
                      ),
                    const SizedBox(height: 14),

                    // 5. Department Leaderboard Tile
                    const AnalyticsLeaderboardTile(),
                    const SizedBox(height: 14),

                    // 6. Course Activity Heatmap
                    if (hState.data != null)
                      AnalyticsHeatmapCard(data: hState.data!),
                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorCard(String error, bool isDark) {
    return GlassCard(
      borderColor: SasColors.danger.withValues(alpha: 0.30),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 36,
              color: SasColors.danger,
            ),
            const SizedBox(height: 10),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isDark ? SasColors.maidenMist : SasColors.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 14),
            GlassButton(
              label: 'Retry',
              icon: Icons.refresh_rounded,
              onPressed: () => ref.read(historyProvider.notifier).fetch(),
            ),
          ],
        ),
      ),
    );
  }
}
