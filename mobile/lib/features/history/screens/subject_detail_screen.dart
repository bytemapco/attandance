import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/features/analytics/providers/analytics_provider.dart';
import 'package:smart_attendance_app/features/analytics/widgets/subject_figures_card.dart';
import 'package:smart_attendance_app/features/history/providers/subject_history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/class_detail_sheet.dart';
import 'package:smart_attendance_app/features/history/widgets/history_list.dart';
import 'package:smart_attendance_app/shared/widgets/app_top_bar.dart';
import 'package:smart_attendance_app/shared/widgets/screen_background.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

/// One subject: its percentage and what the student can do about it, then every class of it.
class SubjectDetailScreen extends ConsumerStatefulWidget {
  final String courseSectionId;

  const SubjectDetailScreen({super.key, required this.courseSectionId});

  @override
  ConsumerState<SubjectDetailScreen> createState() =>
      _SubjectDetailScreenState();
}

class _SubjectDetailScreenState extends ConsumerState<SubjectDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      ref.read(subjectHistoryProvider(widget.courseSectionId).notifier).fetch();
      if (!ref.read(analyticsProvider).hasData) {
        ref.read(analyticsProvider.notifier).fetch();
      }
    });
  }

  SubjectFigures? _subject(StudentAnalytics? analytics) {
    for (final subject in analytics?.subjects ?? const <SubjectFigures>[]) {
      if (subject.courseSectionId == widget.courseSectionId) return subject;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final history = ref.watch(subjectHistoryProvider(widget.courseSectionId));
    final notifier = ref.read(
      subjectHistoryProvider(widget.courseSectionId).notifier,
    );
    final analytics = ref.watch(analyticsProvider).data;
    final subject = _subject(analytics);

    return Scaffold(
      appBar: AppTopBar(title: subject?.subjectName ?? 'Subject'),
      body: ScreenBackground(
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
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  children: [
                    if (subject != null && analytics != null) ...[
                      SubjectFiguresCard(
                        subject: subject,
                        threshold: analytics.threshold,
                      ),
                      const SizedBox(height: 16),
                    ],
                    HistoryList(
                      state: history,
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
      ),
    );
  }
}
