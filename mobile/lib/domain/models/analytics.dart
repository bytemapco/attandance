import 'package:smart_attendance_app/core/ist_clock.dart';

/// Where the student stands against the institution's minimum. The server decides.
enum Standing {
  noData,
  ok,
  atRisk,
  shortage;

  static Standing parse(String raw) => switch (raw) {
    'OK' => ok,
    'AT_RISK' => atRisk,
    'SHORTAGE' => shortage,
    'NO_DATA' => noData,
    _ => throw FormatException('Unknown standing', raw),
  };
}

class AttendanceFigures {
  final int conducted;
  final int attended;

  /// Null until a class has been held. Never shown as 0 or 100 in its place.
  final double? percentage;
  final int canMiss;
  final int mustAttend;
  final Standing standing;

  const AttendanceFigures({
    required this.conducted,
    required this.attended,
    required this.percentage,
    required this.canMiss,
    required this.mustAttend,
    required this.standing,
  });

  factory AttendanceFigures.fromJson(Map<String, dynamic> json) =>
      AttendanceFigures(
        conducted: json['conducted'] as int,
        attended: json['attended'] as int,
        percentage: (json['percentage'] as num?)?.toDouble(),
        canMiss: json['can_miss'] as int? ?? 0,
        mustAttend: json['must_attend'] as int? ?? 0,
        standing: Standing.parse(json['standing'] as String),
      );
}

class SubjectFigures {
  final String courseSectionId;
  final String subjectName;
  final String subjectCode;
  final String classCode;
  final String? teacherName;
  final AttendanceFigures figures;

  const SubjectFigures({
    required this.courseSectionId,
    required this.subjectName,
    required this.subjectCode,
    required this.classCode,
    required this.teacherName,
    required this.figures,
  });

  factory SubjectFigures.fromJson(Map<String, dynamic> json) => SubjectFigures(
    courseSectionId: json['course_section_id'] as String,
    subjectName: json['subject_name'] as String,
    subjectCode: json['subject_code'] as String,
    classCode: json['class_code'] as String,
    teacherName: json['teacher_name'] as String?,
    figures: AttendanceFigures.fromJson(json),
  );
}

class WeekFigures {
  final DateTime weekStart;
  final int conducted;
  final int attended;
  final double? percentage;

  const WeekFigures({
    required this.weekStart,
    required this.conducted,
    required this.attended,
    required this.percentage,
  });

  factory WeekFigures.fromJson(Map<String, dynamic> json) => WeekFigures(
    weekStart: parseServerDay(json['week_start'] as String),
    conducted: json['conducted'] as int,
    attended: json['attended'] as int,
    percentage: (json['percentage'] as num?)?.toDouble(),
  );
}

class StudentAnalytics {
  final double threshold;
  final double atRiskMargin;
  final AttendanceFigures overall;
  final List<SubjectFigures> subjects;
  final List<WeekFigures> weeklyTrend;
  final int currentStreak;
  final int bestStreak;

  const StudentAnalytics({
    required this.threshold,
    required this.atRiskMargin,
    required this.overall,
    required this.subjects,
    required this.weeklyTrend,
    required this.currentStreak,
    required this.bestStreak,
  });

  /// Subjects below the minimum, worst first.
  List<SubjectFigures> get shortages =>
      subjects.where((s) => s.figures.standing == Standing.shortage).toList()
        ..sort(
          (a, b) => (a.figures.percentage ?? 0).compareTo(
            b.figures.percentage ?? 0,
          ),
        );

  /// What the student attended this week, from the newest week of the trend.
  WeekFigures? get thisWeek => weeklyTrend.isEmpty ? null : weeklyTrend.last;

  factory StudentAnalytics.fromJson(Map<String, dynamic> json) {
    final streak = json['streak'] as Map<String, dynamic>;
    return StudentAnalytics(
      threshold: (json['threshold'] as num).toDouble(),
      atRiskMargin: (json['at_risk_margin'] as num).toDouble(),
      overall: AttendanceFigures.fromJson(
        json['overall'] as Map<String, dynamic>,
      ),
      subjects: (json['subjects'] as List<dynamic>)
          .map((s) => SubjectFigures.fromJson(s as Map<String, dynamic>))
          .toList(),
      weeklyTrend: (json['weekly_trend'] as List<dynamic>)
          .map((w) => WeekFigures.fromJson(w as Map<String, dynamic>))
          .toList(),
      currentStreak: streak['current'] as int,
      bestStreak: streak['best'] as int,
    );
  }
}
