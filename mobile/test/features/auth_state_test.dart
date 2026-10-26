import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/domain/models/user.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';

void main() {
  group('AuthStateData', () {
    test('default state starts with loading', () {
      const state = AuthStateData();
      expect(state.status, AuthStatus.loading);
      expect(state.user, isNull);
      expect(state.errorMessage, isNull);
    });

    test('copyWith updates status and error correctly', () {
      const state = AuthStateData();
      final updated = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: 'Invalid credentials',
      );

      expect(updated.status, AuthStatus.unauthenticated);
      expect(updated.errorMessage, 'Invalid credentials');
      expect(updated.user, isNull);
    });

    test('copyWith attaches user profile upon authentication', () {
      const user = UserProfile(
        id: 'usr-1',
        email: 'student@university.edu',
        role: 'STUDENT',
        isActive: true,
      );

      const state = AuthStateData(status: AuthStatus.loading);
      final authenticatedState = state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      );

      expect(authenticatedState.status, AuthStatus.authenticated);
      expect(authenticatedState.user?.email, 'student@university.edu');
      expect(authenticatedState.user?.role, 'STUDENT');
    });
  });
}
