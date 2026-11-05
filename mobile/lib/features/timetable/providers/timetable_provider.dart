import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/error_messages.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/data/api/attendance_updates.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/shared/load_state.dart';

class TimetableState {
  /// Monday of the week on show.
  final DateTime weekStart;
  final DateTime selectedDay;
  final LoadState<StudentTimetable> load;

  const TimetableState({
    required this.weekStart,
    required this.selectedDay,
    this.load = const LoadState(),
  });

  TimetableState copyWith({
    DateTime? weekStart,
    DateTime? selectedDay,
    LoadState<StudentTimetable>? load,
  }) => TimetableState(
    weekStart: weekStart ?? this.weekStart,
    selectedDay: selectedDay ?? this.selectedDay,
    load: load ?? this.load,
  );
}

class TimetableNotifier extends StateNotifier<TimetableState> {
  final StudentInsightsRepository _repo;
  final DateTime Function() _clock;

  TimetableNotifier(this._repo, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now,
      super(_startState((clock ?? DateTime.now)()));

  static TimetableState _startState(DateTime clock) {
    final today = istDay(istNow(clock));
    return TimetableState(weekStart: mondayOf(today), selectedDay: today);
  }

  DateTime get _today => istDay(istNow(_clock()));

  Future<void> fetch() async {
    final week = state.weekStart;
    state = state.copyWith(load: state.load.loading());
    try {
      final result = await _repo.timetable(week);
      if (state.weekStart != week) return;
      state = state.copyWith(load: state.load.loaded(result));
    } catch (e) {
      if (state.weekStart != week) return;
      state = state.copyWith(load: state.load.failed(userMessage(e)));
    }
  }

  /// Moves a week back (-1) or forward (+1). Day one of that week is selected, or today if it is in it.
  Future<void> changeWeek(int delta) {
    final week = state.weekStart.add(Duration(days: 7 * delta));
    return _showWeek(week);
  }

  Future<void> goToToday() {
    state = state.copyWith(selectedDay: _today);
    return _showWeek(mondayOf(_today));
  }

  void selectDay(DateTime day) =>
      state = state.copyWith(selectedDay: istDay(day));

  Future<void> _showWeek(DateTime week) {
    final today = _today;
    final selected = mondayOf(today) == week ? today : week;
    state = TimetableState(weekStart: week, selectedDay: selected);
    return fetch();
  }

  void reset() => state = _startState(_clock());
}

final timetableProvider =
    StateNotifierProvider<TimetableNotifier, TimetableState>((ref) {
      final notifier = TimetableNotifier(
        ref.read(studentInsightsRepositoryProvider),
      );
      refreshOnAttendanceUpdate(ref, notifier.fetch);
      ref.listen(authProvider, (_, next) {
        if (next.status != AuthStatus.authenticated) notifier.reset();
      });
      return notifier;
    });
