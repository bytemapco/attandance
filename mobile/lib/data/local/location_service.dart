import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';
import 'package:smart_attendance_app/core/constants.dart';
import 'package:smart_attendance_app/data/local/geofence_calculator.dart';
import 'package:smart_attendance_app/data/local/location_exceptions.dart';

export 'package:smart_attendance_app/data/local/location_exceptions.dart';
export 'package:smart_attendance_app/data/local/geofence_calculator.dart';

class LocationService {
  Future<void> ensurePermissionsGranted() async {
    final isEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isEnabled) {
      throw const LocationException('Location services are disabled on your device.');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      throw const LocationException('Location permission permanently denied. Open Settings to enable.');
    }
    if (permission == LocationPermission.denied) {
      throw const LocationException('Location permission denied.');
    }
  }

  Future<Position> getHighlyAccuratePosition() async {
    await ensurePermissionsGranted();
    final completer = Completer<Position>();
    StreamSubscription<Position>? subscription;
    Timer? timeoutTimer;
    Position? bestPosition;

    void cleanup() {
      timeoutTimer?.cancel();
      subscription?.cancel();
    }

    timeoutTimer = Timer(Duration(seconds: kGpsTimeoutSeconds), () {
      cleanup();
      if (!completer.isCompleted) {
        if (bestPosition != null && bestPosition!.accuracy <= kMinGpsAccuracyMeters) {
          completer.complete(bestPosition!);
        } else {
          completer.completeError(
            const LocationException('GPS signal too weak or timed out. Please move near a window.'),
          );
        }
      }
    });

    try {
      subscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.best, distanceFilter: 0),
      ).listen(
        (Position pos) {
          if (pos.isMocked) {
            cleanup();
            if (!completer.isCompleted) {
              completer.completeError(const LocationException('Mocked location detected. Attendance blocked.'));
            }
            return;
          }
          if (bestPosition == null || pos.accuracy < bestPosition!.accuracy) {
            bestPosition = pos;
          }
          if (pos.accuracy <= kMinGpsAccuracyMeters) {
            cleanup();
            if (!completer.isCompleted) completer.complete(pos);
          }
        },
        onError: (e) {
          cleanup();
          if (!completer.isCompleted) completer.completeError(LocationException('Failed to acquire location: $e'));
        },
        cancelOnError: true,
      );
    } catch (e) {
      cleanup();
      if (!completer.isCompleted) completer.completeError(LocationException('Failed to start location stream: $e'));
    }

    final finalPos = await completer.future;
    if (finalPos.isMocked) throw const LocationException('Mocked location detected. Attendance blocked.');
    if (finalPos.accuracy > 60.0) throw const LocationException('GPS signal too weak. Please move near a window.');
    return finalPos;
  }

  Future<Position> getAveragedPosition({int samples = kGpsAveragingSamples}) async {
    final positions = <Position>[];
    for (int i = 0; i < samples; i++) {
      try {
        positions.add(await getHighlyAccuratePosition());
        if (i < samples - 1) await Future.delayed(const Duration(seconds: 3));
      } on LocationException {
        if (i < samples - 1) await Future.delayed(const Duration(seconds: 3));
      }
    }
    if (positions.isEmpty) {
      throw const LocationException('Could not acquire enough GPS samples for position averaging.');
    }
    final meanLat = positions.map((p) => p.latitude).reduce((a, b) => a + b) / positions.length;
    final meanLng = positions.map((p) => p.longitude).reduce((a, b) => a + b) / positions.length;
    final varianceLat = positions.map((p) => pow(p.latitude - meanLat, 2)).reduce((a, b) => a + b) / positions.length;
    final varianceLng = positions.map((p) => pow(p.longitude - meanLng, 2)).reduce((a, b) => a + b) / positions.length;
    final stdDev = sqrt(varianceLat + varianceLng) * 111320;

    if (stdDev > 20) {
      throw LocationException('GPS readings unstable (stdDev: ${stdDev.toStringAsFixed(0)}m). Hold steady and retry.');
    }
    final best = positions.reduce((a, b) => a.accuracy <= b.accuracy ? a : b);
    return Position(
      longitude: meanLng,
      latitude: meanLat,
      accuracy: best.accuracy,
      altitude: best.altitude,
      heading: best.heading,
      speed: best.speed,
      speedAccuracy: best.speedAccuracy,
      timestamp: best.timestamp,
      altitudeAccuracy: best.altitudeAccuracy,
      headingAccuracy: best.headingAccuracy,
    );
  }

  bool isWithinGeofence(Position student, double classLat, double classLng, {double radiusMeters = 100.0}) {
    return GeofenceCalculator.isWithinGeofence(student, classLat, classLng, radiusMeters: radiusMeters);
  }

  String describeDistance(Position student, double classLat, double classLng) {
    return GeofenceCalculator.describeDistance(student, classLat, classLng);
  }
}
