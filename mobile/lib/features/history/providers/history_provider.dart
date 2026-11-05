import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/error_messages.dart';
import 'package:smart_attendance_app/data/api/attendance_updates.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';

class HistoryState {
  final HistoryFilter filter;
  final List<HistoryEntry> items;
  final int total;
  final bool hasMore;

  /// When the list is the phone's saved copy because the server could not be reached.
  final DateTime? cachedAt;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  /// Loading the next page failed; the pages already shown stay.
  final String? moreErrorMessage;

  const HistoryState({
    this.filter = const HistoryFilter(),
    this.items = const [],
    this.total = 0,
    this.hasMore = false,
    this.cachedAt,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
    this.moreErrorMessage,
  });

  bool get isInitialLoading => isLoading && items.isEmpty;
  bool get isBlockingError => errorMessage != null && items.isEmpty;
  bool get isEmpty => !isLoading && errorMessage == null && items.isEmpty;

  HistoryState copyWith({
    HistoryFilter? filter,
    List<HistoryEntry>? items,
    int? total,
    bool? hasMore,
    DateTime? cachedAt,
    bool? isLoading,
    bool? isLoadingMore,
    String? errorMessage,
    String? moreErrorMessage,
    bool clearCachedAt = false,
  }) => HistoryState(
    filter: filter ?? this.filter,
    items: items ?? this.items,
    total: total ?? this.total,
    hasMore: hasMore ?? this.hasMore,
    cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
    isLoading: isLoading ?? this.isLoading,
    isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    errorMessage: errorMessage,
    moreErrorMessage: moreErrorMessage,
  );
}

class HistoryNotifier extends StateNotifier<HistoryState> {
  final StudentInsightsRepository _repo;
  int _generation = 0;

  final HistoryFilter _initial;

  HistoryNotifier(
    this._repo, {
    HistoryFilter initialFilter = const HistoryFilter(),
  }) : _initial = initialFilter,
       super(HistoryState(filter: initialFilter));

  /// Loads the first page for the current filter. Rows already on screen stay until it arrives.
  Future<void> fetch() async {
    final generation = ++_generation;
    state = state.copyWith(isLoading: true, isLoadingMore: false);
    try {
      final result = await _repo.history(state.filter);
      if (generation != _generation) return;
      state = state.copyWith(
        items: result.data.items,
        total: result.data.total,
        hasMore: result.data.hasMore,
        cachedAt: result.cachedAt,
        clearCachedAt: !result.isFromCache,
        isLoading: false,
      );
    } catch (e) {
      if (generation != _generation) return;
      state = state.copyWith(isLoading: false, errorMessage: userMessage(e));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoadingMore || state.isLoading) return;
    final generation = _generation;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repo.history(
        state.filter,
        offset: state.items.length,
      );
      if (generation != _generation) return;
      state = state.copyWith(
        items: [...state.items, ...result.data.items],
        total: result.data.total,
        hasMore: result.data.hasMore,
        isLoadingMore: false,
      );
    } catch (e) {
      if (generation != _generation) return;
      state = state.copyWith(
        isLoadingMore: false,
        moreErrorMessage: userMessage(e),
      );
    }
  }

  /// Applies a new filter and reloads from the first page. The old rows are dropped at once so
  /// results for the previous filter never sit under the new one.
  Future<void> setFilter(HistoryFilter filter) {
    state = HistoryState(filter: filter);
    return fetch();
  }

  void reset() {
    _generation++;
    state = HistoryState(filter: _initial);
  }
}

final historyProvider = StateNotifierProvider<HistoryNotifier, HistoryState>((
  ref,
) {
  final notifier = HistoryNotifier(ref.read(studentInsightsRepositoryProvider));
  refreshOnAttendanceUpdate(ref, notifier.fetch);
  ref.listen(authProvider, (_, next) {
    if (next.status != AuthStatus.authenticated) notifier.reset();
  });
  return notifier;
});
