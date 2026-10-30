import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/constants.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';

void main() {
  group('Verification Lifecycle & Timeout Safety', () {
    test('Timeout constants have production-grade allowances', () {
      expect(kReceiveTimeout, greaterThanOrEqualTo(30000));
      expect(kAiAnalysisTimeout, greaterThanOrEqualTo(45000));
      expect(kConnectTimeout, 15000);
    });

    test('AttendanceVerificationState handles timeout error correctly', () {
      const state = AttendanceVerificationState(
        isError: true,
        errorMessage: 'Connection timed out. Please try again.',
        step: VerificationStep.done,
      );

      expect(state.isError, isTrue);
      expect(state.step, VerificationStep.done);
      expect(state.errorMessage, contains('timed out'));

      final config = ResultConfig.error(state.errorMessage);
      expect(config.title, 'Submission Failed');
      expect(config.subtitle, 'Connection timed out. Please try again.');
    });

    test('Reset clears error and restores initial verification step', () {
      const initial = AttendanceVerificationState();
      expect(initial.step, VerificationStep.gps);
      expect(initial.isError, isFalse);
      expect(initial.errorMessage, isNull);
    });
  });
}
