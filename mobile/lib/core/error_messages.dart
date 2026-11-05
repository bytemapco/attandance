import 'package:smart_attendance_app/core/exceptions.dart';
import 'package:smart_attendance_app/utils/logger.dart';

/// The text a student sees for a failure. Server and network errors carry a readable message;
/// anything else is logged and shown as a plain retry prompt.
String userMessage(Object error) {
  if (error is AppException) return error.message;
  AppLogger.error('Unexpected error: $error');
  return 'Something went wrong. Please try again.';
}
