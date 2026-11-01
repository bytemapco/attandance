import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:smart_attendance_app/data/local/geofence_calculator.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/location_service.dart';
import 'package:smart_attendance_app/data/repositories/config_repository.dart';
import 'package:smart_attendance_app/features/attendance/providers/location_provider.dart';

enum GeofenceStatus {
  idle,
  scanning,

  /// Inside the campus boundary, or the institution does not check location.
  success,

  /// The institution has not set a campus location. The attendance is flagged for review.
  notConfigured,

  /// Outside the boundary, or no GPS fix could be taken.
  failed,
}

const String kLocationUnavailableMessage =
    'Could not get your location. Turn on GPS and try again.';
const String kOutsideBoundaryMessage = 'You are outside the campus boundary.';

class GeofenceVerificationState {
  final GeofenceStatus status;
  final String? errorMessage;
  final double? distanceMeters;
  final double? radiusMeters;
  final double? accuracy;
  final Position? position;

  const GeofenceVerificationState({
    this.status = GeofenceStatus.idle,
    this.errorMessage,
    this.distanceMeters,
    this.radiusMeters,
    this.accuracy,
    this.position,
  });

  GeofenceVerificationState copyWith({
    GeofenceStatus? status,
    String? errorMessage,
    double? distanceMeters,
    double? radiusMeters,
    double? accuracy,
    Position? position,
    bool clearError = false,
  }) {
    return GeofenceVerificationState(
      status: status ?? this.status,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      distanceMeters: distanceMeters ?? this.distanceMeters,
      radiusMeters: radiusMeters ?? this.radiusMeters,
      accuracy: accuracy ?? this.accuracy,
      position: position ?? this.position,
    );
  }
}

class GeofenceVerificationNotifier
    extends AutoDisposeNotifier<GeofenceVerificationState> {
  @override
  GeofenceVerificationState build() {
    return const GeofenceVerificationState();
  }

  /// Decides the location outcome for one class. [classLat], [classLng] and [radius] come from
  /// the institution's campus location. They are null until an admin sets it.
  Future<void> verifyLocation({
    required double? classLat,
    required double? classLng,
    required double? radius,
  }) async {
    state = state.copyWith(status: GeofenceStatus.scanning, clearError: true);

    final Position position;
    try {
      position = await ref
          .read(locationServiceProvider)
          .getHighlyAccuratePosition();
    } on LocationException catch (e) {
      _fail(e.message);
      return;
    } catch (_) {
      _fail(kLocationUnavailableMessage);
      return;
    }

    try {
      await ref.read(configRepositoryProvider).fetchAndCacheConfig();
    } catch (_) {}
    final config = ref.read(hiveServiceProvider).getSystemConfig();

    if (!config.isGpsVerificationEnabled) {
      state = state.copyWith(
        status: GeofenceStatus.success,
        position: position,
        accuracy: position.accuracy,
      );
      return;
    }

    if (classLat == null || classLng == null || radius == null) {
      state = state.copyWith(
        status: GeofenceStatus.notConfigured,
        position: position,
        accuracy: position.accuracy,
      );
      return;
    }

    final distance = GeofenceCalculator.distanceMeters(
      fromLatitude: position.latitude,
      fromLongitude: position.longitude,
      toLatitude: classLat,
      toLongitude: classLng,
    );
    final isInside = GeofenceCalculator.isWithinFence(
      distance: distance,
      radiusMeters: radius,
      accuracy: position.accuracy,
    );
    state = state.copyWith(
      status: isInside ? GeofenceStatus.success : GeofenceStatus.failed,
      errorMessage: isInside ? null : kOutsideBoundaryMessage,
      position: position,
      distanceMeters: distance,
      radiusMeters: radius,
      accuracy: position.accuracy,
    );
  }

  void _fail(String message) {
    state = state.copyWith(
      status: GeofenceStatus.failed,
      errorMessage: message,
    );
  }

  void reset() {
    state = const GeofenceVerificationState();
  }
}

final geofenceVerificationProvider =
    NotifierProvider.autoDispose<
      GeofenceVerificationNotifier,
      GeofenceVerificationState
    >(() => GeofenceVerificationNotifier());
