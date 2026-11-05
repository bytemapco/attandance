import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:smart_attendance_app/core/exceptions.dart';
import 'package:smart_attendance_app/data/api/student_insights_api.dart';
import 'package:smart_attendance_app/data/local/read_cache.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/history.dart';

import '../helpers/fixtures.dart';

class FakeApi implements StudentInsightsApi {
  Object? failure;
  int calls = 0;
  HistoryFilter? lastFilter;
  int? lastOffset;

  Future<Map<String, dynamic>> _answer(Map<String, dynamic> json) async {
    calls++;
    final error = failure;
    if (error != null) throw error;
    return json;
  }

  @override
  Future<Map<String, dynamic>> timetable(DateTime from, DateTime to) =>
      _answer(timetableJson([timetableEntryJson()]));

  @override
  Future<Map<String, dynamic>> history(
    HistoryFilter filter, {
    required int limit,
    required int offset,
  }) {
    lastFilter = filter;
    lastOffset = offset;
    return _answer(historyPageJson([historyEntryJson()]));
  }

  @override
  Future<Map<String, dynamic>> analytics() => _answer(analyticsJson());
}

DioException offline() => DioException(
  requestOptions: RequestOptions(path: '/x'),
  type: DioExceptionType.connectionError,
);

DioException rejected(int status) => DioException(
  requestOptions: RequestOptions(path: '/x'),
  type: DioExceptionType.badResponse,
  response: Response(
    requestOptions: RequestOptions(path: '/x'),
    statusCode: status,
    data: {'detail': 'No.'},
  ),
);

void main() {
  late Directory dir;
  late FakeApi api;
  late String? owner;
  late StudentInsightsRepository repo;

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('insights_cache');
    Hive.init(dir.path);
    final box = await Hive.openBox<String>('cache_${dir.path.hashCode}');
    api = FakeApi();
    owner = 'user-1';
    repo = StudentInsightsRepository(
      api: api,
      cache: ReadCache(box),
      ownerId: () => owner,
    );
  });

  tearDown(() async {
    await Hive.close();
    await dir.delete(recursive: true);
  });

  final monday = DateTime.utc(2026, 11, 2);

  test('a good answer is returned fresh', () async {
    final result = await repo.timetable(monday);
    expect(result.isFromCache, isFalse);
    expect(result.data.days.single.entries, hasLength(1));
  });

  test('offline, the last good answer comes back marked with when it was saved', () async {
    await repo.analytics();
    api.failure = offline();
    final result = await repo.analytics();
    expect(result.isFromCache, isTrue);
    expect(result.cachedAt, isNotNull);
    expect(result.data.overall.attended, 18);
  });

  test('a server fault also falls back to the saved answer', () async {
    await repo.timetable(monday);
    api.failure = rejected(503);
    expect((await repo.timetable(monday)).isFromCache, isTrue);
  });

  test('offline with nothing saved is a network error', () async {
    api.failure = offline();
    expect(repo.analytics(), throwsA(isA<NetworkException>()));
  });

  test('a rejection from the server is shown, not hidden behind old data', () async {
    await repo.analytics();
    api.failure = rejected(403);
    expect(repo.analytics(), throwsA(isA<AuthException>()));
  });

  test('each week of the timetable is saved on its own', () async {
    await repo.timetable(monday);
    api.failure = offline();
    expect(repo.timetable(DateTime.utc(2026, 11, 9)), throwsA(isA<NetworkException>()));
    expect((await repo.timetable(DateTime.utc(2026, 11, 4))).isFromCache, isTrue);
  });

  test('only the first unfiltered history page is saved', () async {
    await repo.history(const HistoryFilter());
    api.failure = offline();
    expect((await repo.history(const HistoryFilter())).isFromCache, isTrue);
    expect(
      repo.history(const HistoryFilter(outcome: AttendanceOutcome.late)),
      throwsA(isA<NetworkException>()),
    );
    expect(repo.history(const HistoryFilter(), offset: 30), throwsA(isA<NetworkException>()));
  });

  test('the filter and offset reach the server', () async {
    const filter = HistoryFilter(courseSectionId: 'sec-1');
    await repo.history(filter, offset: 30);
    expect(api.lastFilter, filter);
    expect(api.lastOffset, 30);
  });

  test('saved answers are never shared between students', () async {
    await repo.analytics();
    owner = 'user-2';
    api.failure = offline();
    expect(repo.analytics(), throwsA(isA<NetworkException>()));
  });

  test('nothing is saved when nobody is signed in', () async {
    owner = null;
    await repo.analytics();
    api.failure = offline();
    expect(repo.analytics(), throwsA(isA<NetworkException>()));
  });
}
