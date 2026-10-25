import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

final permissionServiceProvider = Provider<PermissionService>((ref) {
  return const PermissionService();
});

class PermissionStatusResult {
  final bool isLocationServiceEnabled;
  final LocationPermission locationPermission;
  final bool hasLocationAccess;
  final bool isPermanentlyDenied;
  final String? message;

  const PermissionStatusResult({
    required this.isLocationServiceEnabled,
    required this.locationPermission,
    required this.hasLocationAccess,
    required this.isPermanentlyDenied,
    this.message,
  });
}

class PermissionService {
  const PermissionService();

  Future<PermissionStatusResult> checkAttendancePermissions() async {
    final isLocationServiceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isLocationServiceEnabled) {
      return const PermissionStatusResult(
        isLocationServiceEnabled: false,
        locationPermission: LocationPermission.unableToDetermine,
        hasLocationAccess: false,
        isPermanentlyDenied: false,
        message: 'Device location service is turned off. Please turn on GPS.',
      );
    }

    final permission = await Geolocator.checkPermission();
    final hasAccess = permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
    final isPermanent = permission == LocationPermission.deniedForever;

    String? msg;
    if (permission == LocationPermission.denied) {
      msg = 'Location permission is required to verify classroom geofence.';
    } else if (isPermanent) {
      msg = 'Location permission is permanently denied. Please enable in App Settings.';
    }

    return PermissionStatusResult(
      isLocationServiceEnabled: isLocationServiceEnabled,
      locationPermission: permission,
      hasLocationAccess: hasAccess,
      isPermanentlyDenied: isPermanent,
      message: msg,
    );
  }

  Future<PermissionStatusResult> requestLocationPermission() async {
    final isLocationServiceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isLocationServiceEnabled) {
      await Geolocator.openLocationSettings();
      return checkAttendancePermissions();
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      await Geolocator.openAppSettings();
    }

    return checkAttendancePermissions();
  }

  Future<bool> openAppSettings() => Geolocator.openAppSettings();
  Future<bool> openLocationSettings() => Geolocator.openLocationSettings();
}
