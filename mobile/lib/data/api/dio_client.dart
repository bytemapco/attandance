import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/constants.dart';
import 'package:smart_attendance_app/core/exceptions.dart';
import 'package:smart_attendance_app/core/events.dart';
import 'package:smart_attendance_app/data/local/secure_storage.dart';
import 'package:smart_attendance_app/utils/logger.dart';

final dioProvider = Provider<Dio>((ref) {
  final normalizedBaseUrl = kApiBaseUrl.endsWith('/')
      ? kApiBaseUrl
      : '$kApiBaseUrl/';
  final dio = Dio(
    BaseOptions(
      baseUrl: normalizedBaseUrl,
      connectTimeout: const Duration(milliseconds: kConnectTimeout),
      receiveTimeout: const Duration(milliseconds: kReceiveTimeout),
      headers: {'Accept': 'application/json'},
    ),
  );

  dio.httpClientAdapter = IOHttpClientAdapter(
    createHttpClient: () {
      final client = HttpClient();
      client.badCertificateCallback =
          (X509Certificate cert, String host, int port) {
            if (!kDebugMode) return false;
            final reqHost = host.toLowerCase();
            if (reqHost == 'localhost' ||
                reqHost == '10.0.2.2' ||
                reqHost.startsWith('127.0.0.1')) {
              return true;
            }
            return false;
          };
      return client;
    },
  );

  final storage = ref.read(secureStorageProvider);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        final tenantId = await storage.getTenantId();
        if (tenantId != null && tenantId.isNotEmpty) {
          options.headers['X-Tenant-ID'] = tenantId;
        }

        // Strip leading slash so path resolves relative to baseUrl (preserving /api/v1/)
        if (options.path.startsWith('/') &&
            !options.path.startsWith('http://') &&
            !options.path.startsWith('https://')) {
          options.path = options.path.substring(1);
        }

        handler.next(options);
      },
      onResponse: (response, handler) {
        handler.next(response);
      },
      onError: (error, handler) async {
        AppLogger.error(
          '[HTTP] ${error.requestOptions.method} ${error.requestOptions.uri}: ${error.message ?? error.error}',
        );
        if (error.response?.statusCode == 401 &&
            !error.requestOptions.path.endsWith('/auth/login') &&
            !error.requestOptions.path.endsWith('/auth/logout') &&
            !error.requestOptions.path.endsWith('auth/login') &&
            !error.requestOptions.path.endsWith('auth/logout')) {
          await storage.clearAll();
          AppEvents.broadcastAuthError('session_expired');
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

AppException mapDioError(DioException error) {
  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return const NetworkException('Connection timed out. Please try again.');
    case DioExceptionType.connectionError:
      final detail = error.error?.toString() ?? error.message;
      return NetworkException(
        detail != null && detail.isNotEmpty
            ? 'Connection failed: $detail'
            : 'Unable to connect to the server. Check your internet connection.',
      );
    case DioExceptionType.badResponse:
      final statusCode = error.response?.statusCode ?? 0;
      final detail = _extractDetail(error.response?.data);
      if (statusCode == 401) {
        return AuthException(detail, statusCode: statusCode);
      }
      if (statusCode == 403) {
        return AuthException('Access forbidden', statusCode: statusCode);
      }
      if (statusCode >= 400 && statusCode < 500) {
        return ValidationException(detail, statusCode: statusCode);
      }
      return ServerException(detail, statusCode: statusCode);
    default:
      final detail = error.error?.toString() ?? error.message;
      return NetworkException(
        detail != null && detail.isNotEmpty
            ? detail
            : 'An unexpected network error occurred.',
      );
  }
}

String _extractDetail(dynamic data) {
  if (data is Map) {
    final detail = data['detail'];
    if (detail is String && detail.trim().isNotEmpty) {
      return detail.trim();
    }
    if (detail is List && detail.isNotEmpty) {
      final first = detail.first;
      if (first is Map && first['msg'] != null) {
        return first['msg'].toString();
      }
      return detail.map((e) => e.toString()).join(', ');
    }
    final message = data['message'];
    if (message is String && message.trim().isNotEmpty) {
      return message.trim();
    }
    final error = data['error'];
    if (error is String && error.trim().isNotEmpty) {
      return error.trim();
    }
  }
  return 'Something went wrong. Please try again.';
}
