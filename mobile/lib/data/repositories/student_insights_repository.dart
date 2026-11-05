import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';
import 'package:smart_attendance_app/data/api/network_errors.dart';
import 'package:smart_attendance_app/data/api/student_insights_api.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/read_cache.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';

final studentInsightsRepositoryProvider = Provider<StudentInsightsRepository>((
  ref,
) {
  final hive = ref.read(hiveServiceProvider);
  return StudentInsightsRepository(
    api: ref.read(studentInsightsApiProvider),
    cache: hive.readCache,
    ownerId: () => hive.getCachedProfile()?.id,
  );
});

/// An answer, and when it was saved if it came from the phone because the server was unreachable.
class Loaded<T> {
  final T data;
  final DateTime? cachedAt;

  const Loaded(this.data, {this.cachedAt});

  bool get isFromCache => cachedAt != null;
}

/// Loads the timetable, history and analytics. A good answer is saved; if the server cannot be
/// reached the last saved answer is returned instead, marked with when it was saved.
class StudentInsightsRepository {
  static const int historyPageSize = 30;

  final StudentInsightsApi _api;
  final ReadCache _cache;
  final String? Function() _ownerId;

  const StudentInsightsRepository({
    required StudentInsightsApi api,
    required ReadCache cache,
    required String? Function() ownerId,
  }) : _api = api,
       _cache = cache,
       _ownerId = ownerId;

  Future<Loaded<StudentTimetable>> timetable(DateTime weekStart) {
    final monday = mondayOf(weekStart);
    return _load(
      key: 'timetable:${formatServerDay(monday)}',
      fetch: () => _api.timetable(monday, monday.add(const Duration(days: 6))),
      parse: StudentTimetable.fromJson,
    );
  }

  /// Only the first page of the unfiltered list is saved; filtered and later pages need a connection.
  Future<Loaded<HistoryPage>> history(
    HistoryFilter filter, {
    int offset = 0,
  }) {
    final saveable = filter.isEmpty && offset == 0;
    return _load(
      key: saveable ? 'history:first' : null,
      fetch: () =>
          _api.history(filter, limit: historyPageSize, offset: offset),
      parse: HistoryPage.fromJson,
    );
  }

  Future<Loaded<StudentAnalytics>> analytics() => _load(
    key: 'analytics',
    fetch: _api.analytics,
    parse: StudentAnalytics.fromJson,
  );

  Future<Loaded<T>> _load<T>({
    required String? key,
    required Future<Map<String, dynamic>> Function() fetch,
    required T Function(Map<String, dynamic>) parse,
  }) async {
    final scoped = _scoped(key);
    try {
      final json = await fetch();
      final result = Loaded(parse(json));
      if (scoped != null) await _cache.put(scoped, json);
      return result;
    } on DioException catch (e) {
      final saved = scoped == null ? null : _cache.get(scoped);
      if (saved != null && isTransientNetworkError(e)) {
        return Loaded(parse(saved.data), cachedAt: saved.savedAt);
      }
      throw mapDioError(e);
    }
  }

  /// Saved answers belong to the signed-in student; nothing is saved or read without one.
  String? _scoped(String? key) {
    final owner = _ownerId();
    return key == null || owner == null ? null : '$owner|$key';
  }
}
