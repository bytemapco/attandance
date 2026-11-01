class ClassOccurrenceModel {
  final String id;
  final String tenantId;
  final String courseSectionId;
  final String date;
  final String courseName;
  final String subjectCode;
  final String sectionName;
  final String classroomName;
  final String facultyName;
  final String startTime;
  final String endTime;
  final String status;
  final bool isAttendanceLocked;
  final int presentCount;
  final int totalEnrolled;

  const ClassOccurrenceModel({
    required this.id,
    required this.tenantId,
    required this.courseSectionId,
    required this.date,
    required this.courseName,
    required this.subjectCode,
    required this.sectionName,
    required this.classroomName,
    required this.facultyName,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.isAttendanceLocked,
    this.presentCount = 0,
    this.totalEnrolled = 0,
  });

  bool get isConducted => status == 'CONDUCTED';
  bool get isScheduled => status == 'SCHEDULED';
  bool get isCancelled => status == 'CANCELLED';

  factory ClassOccurrenceModel.fromJson(Map<String, dynamic> json) =>
      ClassOccurrenceModel(
        id: json['id'] as String? ?? '',
        tenantId: json['tenant_id'] as String? ?? '',
        courseSectionId: json['course_section_id'] as String? ?? '',
        date: json['date'] as String? ?? '',
        courseName: json['course_name'] as String? ?? 'Class',
        subjectCode: json['subject_code'] as String? ?? '',
        sectionName: json['section_name'] as String? ?? '',
        classroomName: json['classroom_name'] as String? ?? 'Room TBA',
        facultyName: json['faculty_name'] as String? ?? '',
        startTime: json['start_time'] as String? ?? '',
        endTime: json['end_time'] as String? ?? '',
        status: json['status'] as String? ?? 'SCHEDULED',
        isAttendanceLocked: json['is_attendance_locked'] as bool? ?? false,
        presentCount: (json['present_count'] as num?)?.toInt() ?? 0,
        totalEnrolled: (json['total_enrolled'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'tenant_id': tenantId,
    'course_section_id': courseSectionId,
    'date': date,
    'course_name': courseName,
    'subject_code': subjectCode,
    'section_name': sectionName,
    'classroom_name': classroomName,
    'faculty_name': facultyName,
    'start_time': startTime,
    'end_time': endTime,
    'status': status,
    'is_attendance_locked': isAttendanceLocked,
    'present_count': presentCount,
    'total_enrolled': totalEnrolled,
  };
}
