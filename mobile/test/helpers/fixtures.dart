/// Server answers as the backend sends them, for tests.
Map<String, dynamic> timetableEntryJson({
  String? occurrenceId,
  String section = 'sec-1',
  String subject = 'Maths',
  String date = '2026-11-02',
  String start = '09:00',
  String end = '10:00',
  String status = 'SCHEDULED',
  String? attendanceStatus,
  bool windowOpen = false,
  String? windowClosesAt,
  String? cancellationReason,
  bool isSubstitute = false,
  bool isExtra = false,
  String? teacher = 'Asha Rao',
}) => {
  'occurrence_id': occurrenceId,
  'course_section_id': section,
  'subject_name': subject,
  'subject_code': 'MA101',
  'class_code': 'CE-A',
  'date': date,
  'start_time': start,
  'end_time': end,
  'classroom_name': 'Room 12',
  'teacher_name': teacher,
  'status': status,
  'cancellation_reason': cancellationReason,
  'is_substitute': isSubstitute,
  'is_extra': isExtra,
  'attendance_status': attendanceStatus,
  'window_open': windowOpen,
  'window_closes_at': windowClosesAt,
};

Map<String, dynamic> timetableJson(List<Map<String, dynamic>> entries) => {
  'generated_at': '2026-11-02T08:00:00+05:30',
  'today': '2026-11-02',
  'saturday_enabled': false,
  'days': [
    {'date': '2026-11-02', 'weekday': 1, 'entries': entries},
  ],
};

Map<String, dynamic> historyEntryJson({
  String occurrenceId = 'occ-1',
  String status = 'PRESENT',
  String date = '2026-11-02',
  String section = 'sec-1',
}) => {
  'occurrence_id': occurrenceId,
  'attendance_id': status == 'ABSENT' ? null : 'rec-$occurrenceId',
  'course_section_id': section,
  'subject_name': 'Maths',
  'subject_code': 'MA101',
  'class_code': 'CE-A',
  'date': date,
  'start_time': '09:00',
  'end_time': '10:00',
  'status': status,
  'method': status == 'ABSENT' ? null : 'QR_CODE',
  'marked_at': status == 'ABSENT' ? null : '2026-11-02T03:35:00Z',
  'face_score': null,
  'liveness_score': null,
  'remarks': null,
  'student_note': null,
  'can_add_note': status == 'FLAGGED',
};

Map<String, dynamic> historyPageJson(
  List<Map<String, dynamic>> items, {
  int total = 0,
  int offset = 0,
  bool hasMore = false,
}) => {
  'items': items,
  'total': total == 0 ? items.length : total,
  'limit': 30,
  'offset': offset,
  'has_more': hasMore,
};

Map<String, dynamic> figuresJson({
  int conducted = 20,
  int attended = 18,
  double? percentage = 90.0,
  int canMiss = 4,
  int mustAttend = 0,
  String standing = 'OK',
}) => {
  'conducted': conducted,
  'attended': attended,
  'percentage': percentage,
  'can_miss': canMiss,
  'must_attend': mustAttend,
  'standing': standing,
};

Map<String, dynamic> analyticsJson({
  Map<String, dynamic>? overall,
  List<Map<String, dynamic>>? subjects,
  List<Map<String, dynamic>>? trend,
}) => {
  'threshold': 75.0,
  'at_risk_margin': 5.0,
  'overall': overall ?? figuresJson(),
  'subjects':
      subjects ??
      [
        {
          ...figuresJson(),
          'course_section_id': 'sec-1',
          'subject_name': 'Maths',
          'subject_code': 'MA101',
          'class_code': 'CE-A',
          'teacher_name': 'Asha Rao',
        },
      ],
  'weekly_trend':
      trend ??
      [
        {
          'week_start': '2026-11-02',
          'conducted': 4,
          'attended': 3,
          'percentage': 75.0,
        },
      ],
  'streak': {'current': 3, 'best': 7},
};
