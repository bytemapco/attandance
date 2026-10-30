import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/models/smart_pass.dart';

void main() {
  group('SmartPass Model', () {
    test('parses active smart pass and checks expiry', () {
      final futureDate = DateTime.now()
          .add(const Duration(minutes: 5))
          .toIso8601String();
      final json = {
        'qr_token': 'jwt.token.here',
        'expires_at': futureDate,
        'student_name': 'John Doe',
        'enrollment_number': 'STU-2026-001',
      };

      final pass = SmartPass.fromJson(json);

      expect(pass.qrToken, 'jwt.token.here');
      expect(pass.studentName, 'John Doe');
      expect(pass.enrollmentNumber, 'STU-2026-001');
      expect(pass.isExpired, isFalse);
      expect(pass.timeRemaining.inSeconds, greaterThan(0));
    });

    test('detects expired smart pass', () {
      final pastDate = DateTime.now()
          .subtract(const Duration(minutes: 5))
          .toIso8601String();
      final json = {
        'qr_token': 'expired.token.here',
        'expires_at': pastDate,
        'student_name': 'Jane Doe',
        'enrollment_number': 'STU-2026-002',
      };

      final pass = SmartPass.fromJson(json);
      expect(pass.isExpired, isTrue);
    });
  });

  group('SmartPassScanResult Model', () {
    test('parses scan response with defaults', () {
      final json = {
        'status': 'success',
        'session_id': 'sess-100',
        'class_name': 'Physics 101',
        'subject': 'Physics',
        'attendance_status': 'Present',
        'student_name': 'Alice Smith',
        'enrollment_number': 'STU-100',
        'marked_at': '2026-10-26T11:00:00Z',
        'message': 'Marked successfully',
      };

      final result = SmartPassScanResult.fromJson(json);

      expect(result.status, 'success');
      expect(result.sessionId, 'sess-100');
      expect(result.className, 'Physics 101');
      expect(result.attendanceStatus, 'Present');
      expect(result.studentName, 'Alice Smith');
    });
  });
}
