import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/data/local/device_service.dart';
import 'package:smart_attendance_app/data/local/location_service.dart';
import 'package:smart_attendance_app/features/smart_pass/providers/smart_pass_provider.dart';

Position fix() => Position(
  latitude: 12.97,
  longitude: 77.59,
  timestamp: DateTime.now(),
  accuracy: 8,
  altitude: 0,
  altitudeAccuracy: 0,
  heading: 0,
  headingAccuracy: 0,
  speed: 0,
  speedAccuracy: 0,
);

class FakeLocation extends LocationService {
  final Completer<Position> gate = Completer<Position>();
  int requests = 0;
  bool slow = true;

  @override
  Future<Position> getHighlyAccuratePosition() {
    requests++;
    return slow ? gate.future : Future.value(fix());
  }
}

class FakeApi extends StudentApi {
  final List<double> sentAccuracy = [];

  FakeApi() : super(Dio());

  @override
  Future<Map<String, dynamic>> scanSmartPass({
    required String qrToken,
    required double latitude,
    required double longitude,
    required double accuracy,
    required String deviceUuid,
  }) async {
    sentAccuracy.add(accuracy);
    return {
      'status': 'success',
      'session_id': 'occ-1',
      'class_name': 'CSE-A',
      'subject': 'Maths',
      'attendance_status': 'Present',
      'student_name': 'Asha',
      'enrollment_number': 'E1',
      'marked_at': '2026-11-06T10:30:00+00:00',
      'message': 'Attendance marked.',
    };
  }
}

class FakeDevice implements DeviceService {
  @override
  Future<String> getDeviceUUID() async => 'device-1';

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late FakeLocation location;
  late FakeApi api;
  late SmartPassNotifier notifier;

  setUp(() {
    location = FakeLocation();
    api = FakeApi();
    notifier = SmartPassNotifier(api, FakeDevice(), location);
  });

  test('a scan uses the fix taken before it and waits for no new one', () async {
    location.slow = false;
    notifier.prepareLocation();
    await Future<void>.delayed(Duration.zero);

    await notifier.scanAndVerifyPass('qr-token');

    expect(location.requests, 1);
    expect(api.sentAccuracy, [8]);
    expect(notifier.state.scanResult, isNotNull);
  });

  test('a scan during a fix in progress joins it instead of starting another', () async {
    notifier.prepareLocation();
    final scan = notifier.scanAndVerifyPass('qr-token');
    location.gate.complete(fix());
    await scan;

    expect(location.requests, 1);
    expect(notifier.state.scanResult, isNotNull);
  });

  test('a failed early fix is retried when the student scans', () async {
    location.gate.completeError(const LocationException('weak'));
    notifier.prepareLocation();
    await Future<void>.delayed(Duration.zero);
    location.slow = false;

    await notifier.scanAndVerifyPass('qr-token');

    expect(location.requests, 2);
    expect(notifier.state.scanResult, isNotNull);
  });

  test('a location error is shown and nothing is sent', () async {
    final scan = notifier.scanAndVerifyPass('qr-token');
    await Future<void>.delayed(Duration.zero);
    location.gate.completeError(const LocationException('GPS signal too weak.'));
    await scan;

    expect(notifier.state.errorMessage, 'GPS signal too weak.');
    expect(api.sentAccuracy, isEmpty);
  });
}
