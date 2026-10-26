
class SmartPass {
  final String qrToken;
  final DateTime expiresAt;
  final String studentName;
  final String enrollmentNumber;

  const SmartPass({
    required this.qrToken,
    required this.expiresAt,
    required this.studentName,
    required this.enrollmentNumber,
  });

  factory SmartPass.fromJson(Map<String, dynamic> json) {
    return SmartPass(
      qrToken: json['qr_token'] as String,
      expiresAt: DateTime.parse(json['expires_at'] as String),
      studentName: json['student_name'] as String,
      enrollmentNumber: json['enrollment_number'] as String,
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  
  Duration get timeRemaining => expiresAt.difference(DateTime.now());
}

class SmartPassScanResult {
  final String status;
  final String sessionId;
  final String className;
  final String subject;
  final String attendanceStatus;
  final String studentName;
  final String enrollmentNumber;
  final DateTime markedAt;
  final String message;

  const SmartPassScanResult({
    required this.status,
    required this.sessionId,
    required this.className,
    required this.subject,
    required this.attendanceStatus,
    required this.studentName,
    required this.enrollmentNumber,
    required this.markedAt,
    required this.message,
  });

  factory SmartPassScanResult.fromJson(Map<String, dynamic> json) {
    return SmartPassScanResult(
      status: json['status'] as String? ?? 'success',
      sessionId: json['session_id'] as String? ?? '',
      className: json['class_name'] as String? ?? 'Class',
      subject: json['subject'] as String? ?? 'Subject',
      attendanceStatus: json['attendance_status'] as String? ?? 'Present',
      studentName: json['student_name'] as String? ?? '',
      enrollmentNumber: json['enrollment_number'] as String? ?? '',
      markedAt: DateTime.tryParse(json['marked_at'] as String? ?? '') ?? DateTime.now(),
      message: json['message'] as String? ?? 'Attendance marked successfully',
    );
  }
}

