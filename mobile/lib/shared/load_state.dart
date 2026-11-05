import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';

/// What a read-only screen holds: the last answer, whether it came from the phone's saved copy,
/// and whether a refresh is running or failed. Old data stays on screen while it refreshes.
class LoadState<T> {
  final T? data;
  final DateTime? cachedAt;
  final bool isLoading;
  final String? errorMessage;

  const LoadState({
    this.data,
    this.cachedAt,
    this.isLoading = false,
    this.errorMessage,
  });

  bool get hasData => data != null;

  /// First load: nothing to show yet.
  bool get isInitialLoading => isLoading && data == null;

  /// The load failed and there is nothing saved to fall back on.
  bool get isBlockingError => errorMessage != null && data == null;

  LoadState<T> loading() =>
      LoadState(data: data, cachedAt: cachedAt, isLoading: true);

  LoadState<T> loaded(Loaded<T> result) =>
      LoadState(data: result.data, cachedAt: result.cachedAt);

  LoadState<T> failed(String message) =>
      LoadState(data: data, cachedAt: cachedAt, errorMessage: message);
}
