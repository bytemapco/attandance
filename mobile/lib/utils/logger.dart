import 'package:flutter/foundation.dart';

/// Debug-build logging only. Release builds print nothing.
class AppLogger {
  AppLogger._();

  static void debug(String message, {Map<String, dynamic>? context}) =>
      _log('⚫', message, context);

  static void info(String message, {Map<String, dynamic>? context}) =>
      _log('🔵', message, context);

  static void warn(String message, {Map<String, dynamic>? context}) =>
      _log('🟡', message, context);

  static void error(String message, {Map<String, dynamic>? context}) =>
      _log('🔴', message, context);

  static void _log(
    String level,
    String message,
    Map<String, dynamic>? context,
  ) {
    if (!kDebugMode) return;
    debugPrint('$level $message${context != null ? ' $context' : ''}');
  }
}
