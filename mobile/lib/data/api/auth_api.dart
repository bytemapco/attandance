
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';
import 'package:smart_attendance_app/domain/models/user.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.read(dioProvider));
});

class AuthApi {
  final Dio _dio;

  const AuthApi(this._dio);

  Future<TokenResponse> login(String email, String password, {String? deviceUuid}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
        if (deviceUuid != null) 'device_uuid': deviceUuid,
      },
    );
    return TokenResponse.fromJson(response.data!);
  }

  Future<UserProfile> getProfile() async {
    final response = await _dio.get<Map<String, dynamic>>('/auth/me');
    return UserProfile.fromJson(response.data!);
  }

  Future<void> logout() async {
    await _dio.post<void>('/auth/logout');
  }

  Future<void> changePassword({
    required String newPassword,
    String? currentPassword,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      '/auth/change-password',
      data: {
        if (currentPassword != null && currentPassword.isNotEmpty)
          'current_password': currentPassword,
        'new_password': newPassword,
      },
    );
  }

  Future<Map<String, dynamic>> verifyResetToken(String token) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/auth/verify-token',
      queryParameters: {
        'token': token,
        'token_type': 'reset',
      },
    );
    return response.data ?? {};
  }

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      '/auth/reset-password',
      data: {
        'token': token,
        'new_password': newPassword,
      },
    );
  }
}
