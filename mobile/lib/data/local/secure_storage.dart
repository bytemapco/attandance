
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:smart_attendance_app/core/constants.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      resetOnError: true,
    ),
  );

  Future<void> saveToken(String token) async {
    await _storage.write(key: kSecureKeyJwt, value: token);
  }

  Future<String?> getToken() async {
    return _storage.read(key: kSecureKeyJwt);
  }

  Future<void> saveUserRole(String role) async {
    await _storage.write(key: kSecureKeyUserRole, value: role);
  }

  Future<String?> getRole() async {
    return _storage.read(key: kSecureKeyUserRole);
  }

  Future<void> saveDeviceUUID(String uuid) async {
    await _storage.write(key: kSecureKeyDeviceUuid, value: uuid);
  }

  Future<String?> getDeviceUUID() async {
    return _storage.read(key: kSecureKeyDeviceUuid);
  }

  Future<void> saveTenantInfo({
    required String id,
    String? slug,
    String? name,
  }) async {
    await _storage.write(key: kSecureKeyTenantId, value: id);
    if (slug != null) {
      await _storage.write(key: kSecureKeyTenantSlug, value: slug);
    }
    if (name != null) {
      await _storage.write(key: kSecureKeyTenantName, value: name);
    }
  }

  Future<String?> getTenantId() async {
    return _storage.read(key: kSecureKeyTenantId);
  }

  Future<String?> getTenantSlug() async {
    return _storage.read(key: kSecureKeyTenantSlug);
  }

  Future<String?> getTenantName() async {
    return _storage.read(key: kSecureKeyTenantName);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
