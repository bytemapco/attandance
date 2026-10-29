import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/history_calendar_card.dart';
import 'package:smart_attendance_app/features/history/widgets/history_course_card.dart';
import 'package:smart_attendance_app/features/history/widgets/history_header.dart';
import 'package:smart_attendance_app/features/history/widgets/history_list_tab.dart';
import 'package:smart_attendance_app/features/history/widgets/history_segmented_tabs.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  HistoryViewMode _mode = HistoryViewMode.calendar;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) ref.read(historyProvider.notifier).fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final hState = ref.watch(historyProvider);
    final pct = hState.data?.overallAttendancePercentage ?? 0;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pctClean = (pct.isNaN || pct.isInfinite) ? 0.0 : pct;

    final historyList = hState.data?.history ?? [];
    final firstItem = historyList.isNotEmpty ? historyList.first : null;
    final courseTitle = firstItem?.subject ?? 'All Enrolled Subjects';
    final classCode = firstItem != null && firstItem.className.contains(':')
        ? firstItem.className.split(':').first.trim()
        : (firstItem?.className ?? 'Overall');
    final courseSubtitle = '$classCode • Attendance Log';

    return AnimatedBackground(
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: SmartPullToRefresh(
              onRefresh: () => ref.read(historyProvider.notifier).fetch(),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                children: [
                  // Screen header with "Attendance Log" & circular overall gauge
                  HistoryHeader(percentage: pctClean),
                  const SizedBox(height: 16),

                  // Segmented tab switcher ("Calendar" | "List View")
                  HistorySegmentedTabs(
                    mode: _mode,
                    onChanged: (m) => setState(() => _mode = m),
                    isDark: isDark,
                  ),
                  const SizedBox(height: 14),

                  // Course selector dropdown card
                  HistoryCourseCard(
                    courseTitle: courseTitle,
                    courseSubtitle: courseSubtitle,
                  ),
                  const SizedBox(height: 14),

                  // Main content body with smooth cross-fade transition
                  if (hState.errorMessage != null && hState.data == null)
                    _buildErrorCard(hState.errorMessage!, isDark)
                  else if (hState.isLoading && hState.data == null)
                    const ShimmerCalendarPlaceholder()
                  else
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 240),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      transitionBuilder: (child, animation) {
                        return FadeTransition(
                          opacity: animation,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0.0, 0.02),
                              end: Offset.zero,
                            ).animate(animation),
                            child: child,
                          ),
                        );
                      },
                      child: _mode == HistoryViewMode.calendar
                          ? KeyedSubtree(
                              key: const ValueKey('calendar_mode'),
                              child: HistoryCalendarCard(
                                grouped: hState.groupedByDate,
                                history: historyList,
                              ),
                            )
                          : KeyedSubtree(
                              key: const ValueKey('list_mode'),
                              child: HistoryListTab(hState: hState),
                            ),
                    ),

                  const SizedBox(height: 24),
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
        padding: const EdgeInsets.symmetric(vertical: 8),
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
