import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/data/local/device_service.dart';
import 'package:smart_attendance_app/data/local/location_service.dart';
import 'package:smart_attendance_app/domain/models/smart_pass.dart';
import 'package:smart_attendance_app/utils/logger.dart';

class SmartPassState {
  final SmartPass? pass;
  final SmartPassScanResult? scanResult;
  final bool isLoading;
  final String? errorMessage;

  const SmartPassState({
    this.pass,
    this.scanResult,
    this.isLoading = false,
    this.errorMessage,
  });

  SmartPassState copyWith({
    SmartPass? pass,
    SmartPassScanResult? scanResult,
    bool? isLoading,
    String? errorMessage,
    bool clearResult = false,
    bool clearError = false,
  }) {
    return SmartPassState(
      pass: pass ?? this.pass,
      scanResult: clearResult ? null : (scanResult ?? this.scanResult),
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class SmartPassNotifier extends StateNotifier<SmartPassState> {
  final StudentApi _api;
  final DeviceService _deviceService;
  final LocationService _locationService;

  /// The class QR code lives only a few seconds, so the GPS fix is taken while the camera is open,
  /// before the scan. Waiting for it after the scan used up the code's lifetime.
  static const Duration _fixMaxAge = Duration(seconds: 60);

  Position? _fix;
  DateTime? _fixAt;
  Future<Position>? _fixing;

  SmartPassNotifier(this._api, this._deviceService, this._locationService)
    : super(const SmartPassState());

  Future<Position> _currentFix() {
    final fix = _fix;
    final at = _fixAt;
    if (fix != null && at != null && DateTime.now().difference(at) < _fixMaxAge) {
      return Future.value(fix);
    }
    return _fixing ??= _locationService
        .getHighlyAccuratePosition()
        .then((position) {
          _fix = position;
          _fixAt = DateTime.now();
          return position;
        })
        .whenComplete(() => _fixing = null);
  }

  /// Starts the GPS fix early. A failure is reported again when the student scans.
  void prepareLocation() => _currentFix().ignore();

  Future<void> scanAndVerifyPass(String qrToken) async {
    final trimmed = qrToken.trim();
    if (trimmed.isEmpty) {
      state = state.copyWith(
        errorMessage: 'Please scan or enter a valid QR token.',
      );
      return;
    }

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      clearResult: true,
    );
    try {
      final deviceUuid = await _deviceService.getDeviceUUID();

      // The server checks the campus fence with a recent fix and its accuracy. Never send an old
      // or guessed position.
      final Position position;
      try {
        position = await _currentFix();
      } on LocationException catch (e) {
        state = state.copyWith(isLoading: false, errorMessage: e.message);
        return;
      }

      final data = await _api.scanSmartPass(
        qrToken: trimmed,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        deviceUuid: deviceUuid,
      );

      final result = SmartPassScanResult.fromJson(data);
      if (!mounted) return;
      state = state.copyWith(
        isLoading: false,
        scanResult: result,
        clearError: true,
      );
    } on DioException catch (dioErr) {
      if (!mounted) return;
      final mapped = mapDioError(dioErr);
      AppLogger.error('Smart Pass scan error: ${mapped.message}');
      state = state.copyWith(isLoading: false, errorMessage: mapped.message);
    } catch (e) {
      if (!mounted) return;
      AppLogger.error('Smart Pass failed: $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage:
            'Verification failed: ${e.toString().replaceAll("Exception: ", "")}',
      );
    }
  }

  void resetScan() {
    state = state.copyWith(
      clearResult: true,
      clearError: true,
      isLoading: false,
    );
  }
}

final smartPassProvider =
    StateNotifierProvider.autoDispose<SmartPassNotifier, SmartPassState>((ref) {
      return SmartPassNotifier(
        ref.read(studentApiProvider),
        ref.read(deviceServiceProvider),
        LocationService(),
      );
    });
