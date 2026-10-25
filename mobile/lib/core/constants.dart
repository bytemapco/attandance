library;

import 'package:flutter_dotenv/flutter_dotenv.dart';

String get kApiBaseUrl {
  final envUrl = dotenv.isInitialized ? dotenv.env['API_BASE_URL'] : null;
  if (envUrl != null && envUrl.trim().isNotEmpty) return envUrl.trim();
  const defineUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  return defineUrl.trim();
}

const String kHiveBoxProfile = 'sas_profile';
const String kHiveBoxOfflineQueue = 'sas_offline_queue';
const String kHiveBoxNotifications = 'sas_notifications';
const String kHiveBoxConfig = 'sas_config';

const String kSecureKeyJwt = 'sas_jwt_token';
const String kSecureKeyDeviceUuid = 'sas_device_uuid';
const String kSecureKeyUserRole = 'sas_user_role';
const String kSecureKeyTenantId = 'sas_tenant_id';
const String kSecureKeyTenantSlug = 'sas_tenant_slug';
const String kSecureKeyTenantName = 'sas_tenant_name';

const int kConnectTimeout = 15000;
const int kReceiveTimeout = 15000;

const Duration kSessionPollMinInterval = Duration(seconds: 15);
const Duration kSessionPollMaxInterval = Duration(seconds: 60);

const double kMinGpsAccuracyMeters = 60.0;
const double kGeofenceGraceMeters = 10.0;

const int kGpsTimeoutSeconds = 45;

const int kGpsAveragingSamples = 5;

const Duration kOfflineSyncRetryInterval = Duration(seconds: 15);

const Duration kOfflinePayloadMaxAge = Duration(hours: 2);

const String kUniversityEmailDomain = String.fromEnvironment(
  'UNIVERSITY_EMAIL_DOMAIN',
  defaultValue: '',
);
