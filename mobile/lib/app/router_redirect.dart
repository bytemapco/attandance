import 'package:smart_attendance_app/domain/enums/auth_state.dart';

/// Computes the redirection path based on current route path and auth status.
String? computeRouterRedirect({
  required String path,
  required AuthStatus status,
}) {
  if (path == '/splash') {
    if (status == AuthStatus.loading) return null;
    if (status == AuthStatus.unauthenticated) return '/login';
    if (status == AuthStatus.passwordChangeRequired) return '/change-password';
    if (status == AuthStatus.registrationRequired) return '/register-face';
    if (status == AuthStatus.authenticated) return '/home';
    return null;
  }
  if (path == '/login') {
    if (status == AuthStatus.passwordChangeRequired) return '/change-password';
    if (status == AuthStatus.authenticated) return '/home';
    if (status == AuthStatus.registrationRequired) return '/register-face';
    return null;
  }
  if (path == '/reset-password') {
    return null;
  }
  if (path == '/change-password') {
    if (status == AuthStatus.authenticated) return '/home';
    if (status == AuthStatus.registrationRequired) return '/register-face';
    if (status == AuthStatus.unauthenticated) return '/login';
    return null;
  }
  if (path == '/register-face') {
    if (status == AuthStatus.passwordChangeRequired) return '/change-password';
    if (status == AuthStatus.authenticated) return '/home';
    if (status == AuthStatus.unauthenticated) return '/login';
    return null;
  }
  if (status == AuthStatus.unauthenticated) return '/login';
  if (status == AuthStatus.passwordChangeRequired) return '/change-password';
  if (status == AuthStatus.registrationRequired) return '/register-face';
  return null;
}
