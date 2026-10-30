import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/exceptions.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';

void main() {
  group('Dio Client Error Mapping', () {
    test('handles connection timeout correctly', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/test'),
        type: DioExceptionType.connectionTimeout,
      );
      final mapped = mapDioError(dioErr);
      expect(mapped, isA<NetworkException>());
      expect(mapped.message, contains('timed out'));
    });

    test('handles 401 Unauthorized', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          statusCode: 401,
          data: {'detail': 'Invalid credentials'},
        ),
        type: DioExceptionType.badResponse,
      );
      final mapped = mapDioError(dioErr);
      expect(mapped, isA<AuthException>());
      expect(mapped.statusCode, 401);
    });

    test(
      'handles FastAPI 422 validation array error gracefully without type error',
      () {
        final dioErr = DioException(
          requestOptions: RequestOptions(path: '/test'),
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 422,
            data: {
              'detail': [
                {
                  'loc': ['body', 'qr_data'],
                  'msg': 'QR token expired or invalid',
                  'type': 'value_error',
                },
              ],
            },
          ),
          type: DioExceptionType.badResponse,
        );
        final mapped = mapDioError(dioErr);
        expect(mapped, isA<ValidationException>());
        expect(mapped.message, 'QR token expired or invalid');
      },
    );

    test('handles 500 server error', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          statusCode: 500,
          data: {'detail': 'Internal database failure'},
        ),
        type: DioExceptionType.badResponse,
      );
      final mapped = mapDioError(dioErr);
      expect(mapped, isA<ServerException>());
      expect(mapped.message, 'Internal database failure');
    });
  });
}
