import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';
import 'package:smart_attendance_app/domain/models/history.dart';

final studentInsightsApiProvider = Provider<StudentInsightsApi>((ref) {
  return StudentInsightsApi(ref.read(dioProvider));
});

/// The read-only student screens: timetable, history and analytics. Returns the raw JSON so the
/// repository can save exactly what the server said.
class StudentInsightsApi {
  final Dio _dio;

  const StudentInsightsApi(this._dio);

  Future<Map<String, dynamic>> timetable(DateTime from, DateTime to) =>
      _get('/student/timetable', {
        'from': formatServerDay(from),
        'to': formatServerDay(to),
      });

  Future<Map<String, dynamic>> history(
    HistoryFilter filter, {
    required int limit,
    required int offset,
  }) => _get(
    '/student/attendance/history',
    filter.toQuery(limit: limit, offset: offset),
  );

  Future<Map<String, dynamic>> analytics() => _get('/student/analytics');

  Future<Map<String, dynamic>> _get(
    String path, [
    Map<String, dynamic>? query,
  ]) async {
    final response = await _dio.get<Map<String, dynamic>>(
      path,
      queryParameters: query,
    );
    return response.data!;
  }
}
