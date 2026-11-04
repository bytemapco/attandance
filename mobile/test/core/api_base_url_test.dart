import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/constants.dart';

void main() {
  // Tests run without --dart-define, so the build-time value is empty.
  // The app must fail loudly here instead of silently calling a default host.
  test('kApiBaseUrl throws a clear error when API_BASE_URL is not defined', () {
    expect(
      () => kApiBaseUrl,
      throwsA(
        isA<StateError>().having(
          (e) => e.message,
          'message',
          contains('--dart-define=API_BASE_URL'),
        ),
      ),
    );
  });
}
