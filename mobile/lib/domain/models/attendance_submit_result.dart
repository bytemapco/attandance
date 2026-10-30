import 'package:smart_attendance_app/domain/models/attendance.dart';

sealed class AttendanceSubmitResult {}

class OnlineResult extends AttendanceSubmitResult {
  final AttendanceResult result;
  OnlineResult(this.result);
}

class OfflineQueued extends AttendanceSubmitResult {
  final int queuePosition;
  OfflineQueued(this.queuePosition);
}
