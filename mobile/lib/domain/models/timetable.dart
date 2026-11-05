import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/core/server_time.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';

/// Where a class is right now, for the student.
enum ClassPhase { upcoming, inProgress, openForAttendance, marked, ended, cancelled }

class TimetableEntry {
  final String? occurrenceId;
  final String courseSectionId;
  final String subjectName;
  final String subjectCode;
  final String classCode;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String? classroomName;
  final String? teacherName;
  final String status;
  final String? cancellationReason;
  final bool isSubstitute;
  final bool isExtra;
  final AttendanceOutcome? outcome;
  final bool windowOpen;
  final DateTime? windowClosesAt;

  const TimetableEntry({
    required this.occurrenceId,
    required this.courseSectionId,
    required this.subjectName,
    required this.subjectCode,
    required this.classCode,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.classroomName,
    required this.teacherName,
    required this.status,
    required this.cancellationReason,
    required this.isSubstitute,
    required this.isExtra,
    required this.outcome,
    required this.windowOpen,
    required this.windowClosesAt,
  });

  DateTime get startsAt => istWallTime(date, startTime);
  DateTime get endsAt => istWallTime(date, endTime);
  bool get isCancelled => status == 'CANCELLED';

  bool get _hasMark => outcome != null && outcome != AttendanceOutcome.absent;

  /// The student can still mark this class: the teacher's window is open at [clock] and they
  /// have no mark yet. The window time is checked too, because saved data can be hours old.
  bool canMarkAt(DateTime clock) =>
      windowOpen &&
      occurrenceId != null &&
      !_hasMark &&
      (windowClosesAt?.isAfter(clock) ?? false);

  ClassPhase phaseAt(DateTime clock) {
    final nowIst = istNow(clock);
    if (isCancelled) return ClassPhase.cancelled;
    if (canMarkAt(clock)) return ClassPhase.openForAttendance;
    if (_hasMark) return ClassPhase.marked;
    if (!nowIst.isBefore(endsAt)) return ClassPhase.ended;
    if (!nowIst.isBefore(startsAt)) return ClassPhase.inProgress;
    return ClassPhase.upcoming;
  }

  factory TimetableEntry.fromJson(Map<String, dynamic> json) => TimetableEntry(
    occurrenceId: json['occurrence_id'] as String?,
    courseSectionId: json['course_section_id'] as String,
    subjectName: json['subject_name'] as String,
    subjectCode: json['subject_code'] as String,
    classCode: json['class_code'] as String,
    date: parseServerDay(json['date'] as String),
    startTime: json['start_time'] as String,
    endTime: json['end_time'] as String,
    classroomName: json['classroom_name'] as String?,
    teacherName: json['teacher_name'] as String?,
    status: json['status'] as String,
    cancellationReason: json['cancellation_reason'] as String?,
    isSubstitute: json['is_substitute'] as bool? ?? false,
    isExtra: json['is_extra'] as bool? ?? false,
    outcome: AttendanceOutcome.tryParse(json['attendance_status'] as String?),
    windowOpen: json['window_open'] as bool? ?? false,
    windowClosesAt: parseServerTime(json['window_closes_at'] as String?),
  );
}

class TimetableDay {
  final DateTime date;
  final List<TimetableEntry> entries;

  const TimetableDay({required this.date, required this.entries});

  factory TimetableDay.fromJson(Map<String, dynamic> json) => TimetableDay(
    date: parseServerDay(json['date'] as String),
    entries: (json['entries'] as List<dynamic>)
        .map((e) => TimetableEntry.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

class StudentTimetable {
  final List<TimetableDay> days;

  const StudentTimetable({required this.days});

  TimetableDay? dayFor(DateTime date) {
    for (final day in days) {
      if (day.date == istDay(date)) return day;
    }
    return null;
  }

  factory StudentTimetable.fromJson(Map<String, dynamic> json) =>
      StudentTimetable(
        days: (json['days'] as List<dynamic>)
            .map((d) => TimetableDay.fromJson(d as Map<String, dynamic>))
            .toList(),
      );
}
