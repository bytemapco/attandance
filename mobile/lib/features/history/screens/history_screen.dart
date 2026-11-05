import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/analytics/providers/analytics_provider.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/class_detail_sheet.dart';
import 'package:smart_attendance_app/features/history/widgets/history_filter_bar.dart';
import 'package:smart_attendance_app/features/history/widgets/history_list.dart';
import 'package:smart_attendance_app/shared/widgets/screen_background.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      ref.read(historyProvider.notifier).fetch();
      // The subject filter lists the student's subjects, which analytics already knows.
      if (!ref.read(analyticsProvider).hasData) {
        ref.read(analyticsProvider.notifier).fetch();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(historyProvider);
    final notifier = ref.read(historyProvider.notifier);
    final subjects = ref.watch(analyticsProvider).data?.subjects ?? const [];

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
                    'History',
                    style: TextStyle(
                      color: SasColors.textPrimaryOf(context),
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    state.isBlockingError || state.isInitialLoading
                        ? 'Every class and how it went'
                        : '${state.total} ${state.total == 1 ? 'class' : 'classes'}'
                              '${state.filter.isEmpty ? '' : ' match'}',
                    style: TextStyle(
                      color: SasColors.textMutedOf(context),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 14),
                  HistoryFilterBar(
                    filter: state.filter,
                    subjects: subjects,
                    onChanged: notifier.setFilter,
                  ),
                  const SizedBox(height: 14),
                  HistoryList(
                    state: state,
                    onRetry: notifier.fetch,
                    onLoadMore: notifier.loadMore,
                    onOpen: (entry) => showClassDetailSheet(context, entry),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
