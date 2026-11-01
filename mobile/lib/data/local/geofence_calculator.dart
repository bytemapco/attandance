import 'package:geolocator/geolocator.dart';

/// Client copy of the server rule in backend/app/utils/geofencing.py.
/// A student is inside when the distance is at most the campus radius plus the GPS accuracy.
class GeofenceCalculator {
  GeofenceCalculator._();

  static double distanceMeters({
    required double fromLatitude,
    required double fromLongitude,
    required double toLatitude,
    required double toLongitude,
  }) {
    return Geolocator.distanceBetween(
      fromLatitude,
      fromLongitude,
      toLatitude,
      toLongitude,
    );
  }

  static bool isWithinFence({
    required double distance,
    required double radiusMeters,
    required double accuracy,
  }) {
    return distance <= radiusMeters + accuracy;
  }

  static String formatDistance(double meters) {
    if (meters < 1000) return '${meters.toStringAsFixed(0)}m';
    return '${(meters / 1000).toStringAsFixed(1)}km';
  }
}
