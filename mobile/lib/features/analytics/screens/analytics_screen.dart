import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/performance_summary.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/features/analytics/providers/analytics_provider.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_summary_card.dart';
import 'package:smart_attendance_app/features/analytics/widgets/analytics_trend_card.dart';
import 'package:smart_attendance_app/features/analytics/widgets/subject_figures_card.dart';
import 'package:smart_attendance_app/shared/widgets/empty_state.dart';
import 'package:smart_attendance_app/shared/widgets/info_banner.dart';
import 'package:smart_attendance_app/shared/widgets/saved_data_notice.dart';
import 'package:smart_attendance_app/shared/widgets/screen_background.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';
import 'package:smart_attendance_app/shared/widgets/stat_tile.dart';

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
      if (mounted) ref.read(analyticsProvider.notifier).fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final load = ref.watch(analyticsProvider);
    final notifier = ref.read(analyticsProvider.notifier);
    final analytics = load.data;

    return ScreenBackground(
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: SmartPullToRefresh(
              onRefresh: notifier.fetch,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                children: [
                  Text(
                    'Analytics',
                    style: TextStyle(
                      color: SasColors.textPrimaryOf(context),
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (load.isInitialLoading)
                    const ShimmerPlaceholder(itemCount: 4, itemHeight: 110)
                  else if (load.isBlockingError)
                    InfoBanner(
                      severity: BannerSeverity.danger,
                      message: load.errorMessage!,
                      actionLabel: 'Retry',
                      onAction: notifier.fetch,
                    )
                  else if (analytics != null)
                    ..._content(analytics, load.cachedAt, load.errorMessage),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _content(
    StudentAnalytics analytics,
    DateTime? cachedAt,
    String? refreshError,
  ) {
    final banner = shortageBanner(analytics);
    final week = analytics.thisWeek;
    return [
      if (cachedAt != null) ...[
        SavedDataNotice(savedAt: cachedAt),
        const SizedBox(height: 12),
      ],
      if (refreshError != null) ...[
        InlineInfoBanner(message: 'Could not refresh. $refreshError'),
        const SizedBox(height: 12),
      ],
      AnalyticsSummaryCard(analytics: analytics),
      if (banner != null) ...[
        const SizedBox(height: 12),
        InlineInfoBanner(message: banner, severity: BannerSeverity.danger),
      ],
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(
            child: StatTile(
              label: 'Current streak',
              value: '${analytics.currentStreak}',
              color: SasColors.copperStrong,
              icon: Icons.local_fire_department_rounded,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: StatTile(
              label: 'Best streak',
              value: '${analytics.bestStreak}',
              color: SasColors.info,
              icon: Icons.emoji_events_rounded,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: StatTile(
              label: 'This week',
              value: week == null ? '–' : '${week.attended}/${week.conducted}',
              color: SasColors.success,
              icon: Icons.today_rounded,
            ),
          ),
        ],
      ),
      const SizedBox(height: 12),
      AnalyticsTrendCard(weeks: analytics.weeklyTrend, threshold: analytics.threshold),
      const SizedBox(height: 20),
      Text(
        'Subjects',
        style: TextStyle(
          color: SasColors.textPrimaryOf(context),
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      const SizedBox(height: 10),
      if (analytics.subjects.isEmpty)
        const EmptyState(
          icon: Icons.menu_book_rounded,
          title: 'No subjects yet',
          message: 'Your subjects appear here once you are enrolled in a class.',
        )
      else
        for (final subject in analytics.subjects) ...[
          SubjectFiguresCard(
            subject: subject,
            threshold: analytics.threshold,
            onTap: () => context.push('/subject/${subject.courseSectionId}'),
          ),
          const SizedBox(height: 10),
        ],
    ];
  }
}
