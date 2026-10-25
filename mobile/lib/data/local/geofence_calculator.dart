import 'package:geolocator/geolocator.dart';
import 'package:smart_attendance_app/core/constants.dart';

class GeofenceCalculator {
  static bool isWithinGeofence(
    Position student,
    double classLat,
    double classLng, {
    double radiusMeters = 100.0,
  }) {
    final distance = Geolocator.distanceBetween(
      student.latitude,
      student.longitude,
      classLat,
      classLng,
    );
    return distance <= radiusMeters + kGeofenceGraceMeters;
  }

  static String describeDistance(
    Position student,
    double classLat,
    double classLng,
  ) {
    final distance = Geolocator.distanceBetween(
      student.latitude,
      student.longitude,
      classLat,
      classLng,
    );
    if (distance < 1000) {
      return '${distance.toStringAsFixed(0)}m';
    }
    return '${(distance / 1000).toStringAsFixed(1)}km';
  }
}
