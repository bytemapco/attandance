import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/constants.dart';

void main() {
  // Tests run without --dart-define, so the local default must apply.
  test('kApiBaseUrl defaults to the local emulator backend', () {
    expect(kApiBaseUrl, 'http://10.0.2.2:8000/api/v1');
  });
}
