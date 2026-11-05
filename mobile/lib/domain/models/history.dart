import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/core/server_time.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';

/// One class in the student's history and what it came to for them.
class HistoryEntry {
  final String occurrenceId;
  final String? attendanceId;
  final String courseSectionId;
  final String subjectName;
  final String subjectCode;
  final String classCode;
  final DateTime date;
  final String startTime;
  final String endTime;
  final AttendanceOutcome outcome;
  final String? method;
  final DateTime? markedAt;
  final double? faceScore;
  final double? livenessScore;
  final String? remarks;
  final String? studentNote;
  final bool canAddNote;

  const HistoryEntry({
    required this.occurrenceId,
    required this.attendanceId,
    required this.courseSectionId,
    required this.subjectName,
    required this.subjectCode,
    required this.classCode,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.outcome,
    required this.method,
    required this.markedAt,
    required this.faceScore,
    required this.livenessScore,
    required this.remarks,
    required this.studentNote,
    required this.canAddNote,
  });

  factory HistoryEntry.fromJson(Map<String, dynamic> json) => HistoryEntry(
    occurrenceId: json['occurrence_id'] as String,
    attendanceId: json['attendance_id'] as String?,
    courseSectionId: json['course_section_id'] as String,
    subjectName: json['subject_name'] as String,
    subjectCode: json['subject_code'] as String,
    classCode: json['class_code'] as String,
    date: parseServerDay(json['date'] as String),
    startTime: json['start_time'] as String,
    endTime: json['end_time'] as String,
    outcome: AttendanceOutcome.parse(json['status'] as String),
    method: json['method'] as String?,
    markedAt: parseServerTime(json['marked_at'] as String?),
    faceScore: (json['face_score'] as num?)?.toDouble(),
    livenessScore: (json['liveness_score'] as num?)?.toDouble(),
    remarks: json['remarks'] as String?,
    studentNote: json['student_note'] as String?,
    canAddNote: json['can_add_note'] as bool? ?? false,
  );
}

class HistoryPage {
  final List<HistoryEntry> items;
  final int total;
  final int offset;
  final bool hasMore;

  const HistoryPage({
    required this.items,
    required this.total,
    required this.offset,
    required this.hasMore,
  });

  factory HistoryPage.fromJson(Map<String, dynamic> json) => HistoryPage(
    items: (json['items'] as List<dynamic>)
        .map((e) => HistoryEntry.fromJson(e as Map<String, dynamic>))
        .toList(),
    total: json['total'] as int,
    offset: json['offset'] as int,
    hasMore: json['has_more'] as bool,
  );
}

/// What the history list is narrowed to. Every field is optional.
class HistoryFilter {
  final DateTime? from;
  final DateTime? to;
  final String? courseSectionId;
  final AttendanceOutcome? outcome;

  const HistoryFilter({this.from, this.to, this.courseSectionId, this.outcome});

  bool get isEmpty =>
      from == null && to == null && courseSectionId == null && outcome == null;

  HistoryFilter copyWith({
    DateTime? from,
    DateTime? to,
    String? courseSectionId,
    AttendanceOutcome? outcome,
    bool clearDates = false,
    bool clearSubject = false,
    bool clearOutcome = false,
  }) => HistoryFilter(
    from: clearDates ? null : (from ?? this.from),
    to: clearDates ? null : (to ?? this.to),
    courseSectionId: clearSubject
        ? null
        : (courseSectionId ?? this.courseSectionId),
    outcome: clearOutcome ? null : (outcome ?? this.outcome),
  );


  Map<String, dynamic> toQuery({required int limit, required int offset}) => {
    if (from != null) 'from': formatServerDay(from!),
    if (to != null) 'to': formatServerDay(to!),
    if (courseSectionId != null) 'course_section_id': courseSectionId,
    if (outcome != null) 'status': outcome!.wire,
    'limit': limit,
    'offset': offset,
  };
}
