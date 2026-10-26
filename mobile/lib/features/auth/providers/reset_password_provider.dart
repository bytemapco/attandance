import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/repositories/auth_repository.dart';

class ResetPasswordState {
  final bool isVerifying;
  final bool isSubmitting;
  final bool isValid;
  final String? email;
  final String? name;
  final String? role;
  final String? errorMessage;
  final bool isSuccess;

  const ResetPasswordState({
    this.isVerifying = false,
    this.isSubmitting = false,
    this.isValid = false,
    this.email,
    this.name,
    this.role,
    this.errorMessage,
    this.isSuccess = false,
  });

  ResetPasswordState copyWith({
    bool? isVerifying,
    bool? isSubmitting,
    bool? isValid,
    String? email,
    String? name,
    String? role,
    String? errorMessage,
    bool? isSuccess,
  }) {
    return ResetPasswordState(
      isVerifying: isVerifying ?? this.isVerifying,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isValid: isValid ?? this.isValid,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      errorMessage: errorMessage,
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

final resetPasswordProvider =
    StateNotifierProvider.autoDispose<ResetPasswordNotifier, ResetPasswordState>(
        (ref) {
  return ResetPasswordNotifier(ref.read(authRepositoryProvider));
});

class ResetPasswordNotifier extends StateNotifier<ResetPasswordState> {
  final AuthRepository _repo;

  ResetPasswordNotifier(this._repo) : super(const ResetPasswordState());

  Future<void> verifyToken(String token) async {
    if (token.isEmpty) {
      state = state.copyWith(
        isVerifying: false,
        isValid: false,
        errorMessage: 'Invalid or missing password reset token.',
      );
      return;
    }

    state = state.copyWith(isVerifying: true, errorMessage: null);
    try {
      final res = await _repo.verifyResetToken(token);
      final valid = res['valid'] == true;
      state = state.copyWith(
        isVerifying: false,
        isValid: valid,
        email: res['email']?.toString(),
        name: res['name']?.toString(),
        role: res['role']?.toString(),
        errorMessage: valid ? null : (res['message']?.toString() ?? 'Link has expired.'),
      );
    } catch (e) {
      state = state.copyWith(
        isVerifying: false,
        isValid: false,
        errorMessage: e.toString().replaceAll('Exception:', '').trim(),
      );
    }
  }

  Future<bool> submitReset({
    required String token,
    required String newPassword,
  }) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await _repo.resetPassword(token: token, newPassword: newPassword);
      state = state.copyWith(isSubmitting: false, isSuccess: true);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: e.toString().replaceAll('Exception:', '').trim(),
      );
      return false;
    }
  }
}
