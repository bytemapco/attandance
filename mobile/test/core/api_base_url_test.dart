import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/core/constants.dart';

void main() {
  test('the app talks to the deployed backend over HTTPS', () {
    expect(kApiBaseUrl, 'https://sahaj-backend.bytemap.in/api/v1');
    expect(Uri.parse(kApiBaseUrl).scheme, 'https');
  });
}
