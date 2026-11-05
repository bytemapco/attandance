import 'package:dio/dio.dart';

/// True when the request never got a real answer: no connection, a timeout, or a server fault.
/// These are worth retrying later or answering from saved data. A 4xx is the server's decision.
bool isTransientNetworkError(DioException e) {
  const unreachable = {
    DioExceptionType.connectionTimeout,
    DioExceptionType.sendTimeout,
    DioExceptionType.receiveTimeout,
    DioExceptionType.connectionError,
  };
  if (unreachable.contains(e.type)) return true;
  final status = e.response?.statusCode;
  return status != null && status >= 500;
}
