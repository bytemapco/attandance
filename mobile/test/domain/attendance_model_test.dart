import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

void main() {
  group('AttendanceResult Model', () {
    test('parses json correctly and identifies flags', () {
      final json = {
        'id': 'att-123',
        'student_id': 'stu-456',
        'session_id': 'sess-789',
        'status': 'Present',
        'face_score': 0.95,
        'liveness_score': 0.92,
        'background_score': 0.88,
        'final_ai_score': 0.93,
        'gps_latitude': 12.9716,
        'gps_longitude': 77.5946,
        'created_at': '2026-10-26T10:00:00Z',
      };

      final result = AttendanceResult.fromJson(json);

      expect(result.id, 'att-123');
      expect(result.studentId, 'stu-456');
      expect(result.sessionId, 'sess-789');
      expect(result.status, 'Present');
      expect(result.isPresent, isTrue);
      expect(result.isFlagged, isFalse);
      expect(result.faceScore, 0.95);
      expect(result.finalAiScore, 0.93);
    });

    test('identifies Flagged status properly', () {
      final json = {
        'id': 'att-flagged',
        'student_id': 'stu-456',
        'session_id': 'sess-789',
        'status': 'Flagged',
        'face_score': 0.40,
        'liveness_score': 0.50,
        'background_score': 0.45,
        'final_ai_score': 0.43,
        'gps_latitude': 12.9716,
        'gps_longitude': 77.5946,
        'created_at': '2026-10-26T10:00:00Z',
      };

      final result = AttendanceResult.fromJson(json);
      expect(result.isFlagged, isTrue);
      expect(result.isPresent, isFalse);
    });
  });

  group('StudentClass Model', () {
    test('parses active session and geofence parameters', () {
      final json = {
        'class_id': 'class-1',
        'class_name': 'Data Structures',
        'subject': 'CS201',
        'teacher_name': 'Dr. Alan Turing',
        'active_session_id': 'sess-active-1',
        'session_end_time': '2026-10-26T12:00:00Z',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'radius_meters': 50.0,
      };

      final studentClass = StudentClass.fromJson(json);

      expect(studentClass.classId, 'class-1');
      expect(studentClass.className, 'Data Structures');
      expect(studentClass.activeSessionId, 'sess-active-1');
      expect(studentClass.latitude, 28.6139);
      expect(studentClass.longitude, 77.2090);
      expect(studentClass.radiusMeters, 50.0);
    });
  });
}
