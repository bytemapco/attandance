import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';

void main() {
  group('ResultConfig Factory', () {
    test('present config generates success UI parameters', () {
      final att = AttendanceResult(
        id: 'att-1',
        studentId: 'stu-1',
        sessionId: 'sess-1',
        status: 'Present',
        faceScore: 0.94,
        livenessScore: 0.98,
        backgroundScore: 0.90,
        finalAiScore: 0.95,
        gpsLatitude: 10.0,
        gpsLongitude: 20.0,
        createdAt: DateTime.now(),
      );

      final config = ResultConfig.present(att);

      expect(config.title, 'Verified Present');
      expect(config.scores?.overall, 0.95);
      expect(config.scores?.face, 0.94);
    });

    test('flagged config produces review warning UI', () {
      final att = AttendanceResult(
        id: 'att-2',
        studentId: 'stu-2',
        sessionId: 'sess-2',
        status: 'Flagged',
        faceScore: 0.45,
        livenessScore: 0.50,
        backgroundScore: 0.40,
        finalAiScore: 0.46,
        gpsLatitude: 10.0,
        gpsLongitude: 20.0,
        createdAt: DateTime.now(),
      );

      final config = ResultConfig.flagged(att);

      expect(config.title, 'Sent for Review');
      expect(config.scores?.overall, 0.46);
    });

    test('offline and error configs have appropriate fallback messages', () {
      final offline = ResultConfig.offline();
      expect(offline.title, 'Saved Offline');

      final error = ResultConfig.error('Geofence mismatch');
      expect(error.title, 'Submission Failed');
      expect(error.subtitle, 'Geofence mismatch');
    });
  });
}
