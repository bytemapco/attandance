import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/core/timetable_focus.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/timetable/providers/timetable_provider.dart';
import 'package:smart_attendance_app/features/timetable/widgets/timetable_class_card.dart';
import 'package:smart_attendance_app/features/timetable/widgets/timetable_day_strip.dart';
import 'package:smart_attendance_app/features/timetable/widgets/timetable_week_header.dart';
import 'package:smart_attendance_app/shared/widgets/empty_state.dart';
import 'package:smart_attendance_app/shared/widgets/info_banner.dart';
import 'package:smart_attendance_app/shared/widgets/saved_data_notice.dart';
import 'package:smart_attendance_app/shared/widgets/screen_background.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

class TimetableScreen extends ConsumerStatefulWidget {
  /// The moment the screen treats as now. Tests pass a fixed one.
  final DateTime Function() clock;

  const TimetableScreen({super.key, this.clock = DateTime.now});

  @override
  ConsumerState<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends ConsumerState<TimetableScreen>
    with WidgetsBindingObserver {
  Timer? _tick;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() {
      if (mounted) ref.read(timetableProvider.notifier).fetch();
    });
    // Re-check which class is current as the day goes on.
    _tick = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tick?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(timetableProvider.notifier).fetch();
    }
  }

  Future<void> _mark(TimetableEntry entry) async {
    // The attendance screen reads the campus location from the loaded classes.
    await ref.read(sessionProvider.notifier).fetchSessions();
    if (mounted) context.push('/verify/${entry.occurrenceId}');
  }

  List<DayChipData> _chips(TimetableState state) {
    final table = state.load.data;
    if (table != null) {
      return [
        for (final day in table.days)
          DayChipData(date: day.date, classCount: day.entries.length),
      ];
    }
    return [
      for (var i = 0; i < 5; i++)
        DayChipData(date: state.weekStart.add(Duration(days: i)), classCount: 0),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(timetableProvider);
    final notifier = ref.read(timetableProvider.notifier);
    final clock = widget.clock();
    final today = istDay(istNow(clock));

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
                    'Timetable',
                    style: TextStyle(
                      color: SasColors.textPrimaryOf(context),
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TimetableWeekHeader(
                    weekStart: state.weekStart,
                    isCurrentWeek: state.weekStart == mondayOf(today),
                    onPrevious: () => notifier.changeWeek(-1),
                    onNext: () => notifier.changeWeek(1),
                    onToday: notifier.goToToday,
                  ),
                  const SizedBox(height: 8),
                  TimetableDayStrip(
                    days: _chips(state),
                    selected: state.selectedDay,
                    today: today,
                    onSelect: notifier.selectDay,
                  ),
                  const SizedBox(height: 16),
                  if (state.load.cachedAt != null) ...[
                    SavedDataNotice(savedAt: state.load.cachedAt!),
                    const SizedBox(height: 12),
                  ],
                  ..._body(state, clock),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _body(TimetableState state, DateTime clock) {
    final load = state.load;
    if (load.isInitialLoading) {
      return [const ShimmerPlaceholder(itemCount: 3, itemHeight: 96)];
    }
    if (load.isBlockingError) {
      return [
        InfoBanner(
          severity: BannerSeverity.danger,
          message: load.errorMessage!,
          actionLabel: 'Retry',
          onAction: ref.read(timetableProvider.notifier).fetch,
        ),
      ];
    }
    final entries = load.data?.dayFor(state.selectedDay)?.entries ?? const [];
    if (entries.isEmpty) {
      return [
        EmptyState(
          icon: Icons.event_available_rounded,
          title: 'No classes on ${DateFormat('EEEE').format(state.selectedDay)}',
          message: 'A day off, or nothing is scheduled for this day yet.',
        ),
      ];
    }
    final isToday = state.selectedDay == istDay(istNow(clock));
    final focus = isToday ? focusedClass(entries, clock) : null;
    return [
      if (load.errorMessage != null) ...[
        InlineInfoBanner(message: 'Could not refresh. ${load.errorMessage}'),
        const SizedBox(height: 12),
      ],
      for (final entry in entries) ...[
        TimetableClassCard(
          entry: entry,
          clock: clock,
          focus: focus?.entry == entry
              ? (focus!.isCurrent ? ClassFocus.now : ClassFocus.next)
              : null,
          onMark: () => _mark(entry),
        ),
        const SizedBox(height: 10),
      ],
    ];
  }
}
