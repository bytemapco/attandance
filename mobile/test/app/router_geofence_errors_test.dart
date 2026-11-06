import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/app/router_redirect.dart';
import 'package:smart_attendance_app/core/error_messages.dart';
import 'package:smart_attendance_app/core/exceptions.dart';
import 'package:smart_attendance_app/data/local/geofence_calculator.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';

void main() {
  group('router redirect', () {
    String? go(String path, AuthStatus status) => computeRouterRedirect(path: path, status: status);

    test('the splash screen waits while loading and then routes by status', () {
      expect(go('/splash', AuthStatus.loading), isNull);
      expect(go('/splash', AuthStatus.unauthenticated), '/login');
      expect(go('/splash', AuthStatus.passwordChangeRequired), '/change-password');
      expect(go('/splash', AuthStatus.registrationRequired), '/register-face');
      expect(go('/splash', AuthStatus.authenticated), '/home');
    });

    test('a signed-in student does not see the login page again', () {
      expect(go('/login', AuthStatus.authenticated), '/home');
      expect(go('/login', AuthStatus.unauthenticated), isNull);
    });

    test('a signed-out visitor is sent to login from any private page', () {
      for (final path in ['/home', '/history', '/timetable', '/profile']) {
        expect(go(path, AuthStatus.unauthenticated), '/login', reason: path);
      }
    });

    test('a student must change a temporary password before anything else', () {
      expect(go('/home', AuthStatus.passwordChangeRequired), '/change-password');
      expect(go('/register-face', AuthStatus.passwordChangeRequired), '/change-password');
    });

    test('a student must register a face before using the app', () {
      expect(go('/home', AuthStatus.registrationRequired), '/register-face');
    });

    test('password reset is open to everyone', () {
      for (final status in AuthStatus.values) {
        expect(go('/reset-password', status), isNull);
      }
    });

    test('an authenticated student is left alone on private pages', () {
      expect(go('/home', AuthStatus.authenticated), isNull);
    });
  });

  group('geofence', () {
    test('is inside up to the radius plus the GPS accuracy', () {
      expect(GeofenceCalculator.isWithinFence(distance: 100, radiusMeters: 100, accuracy: 0), isTrue);
      expect(GeofenceCalculator.isWithinFence(distance: 145, radiusMeters: 100, accuracy: 50), isTrue);
      expect(GeofenceCalculator.isWithinFence(distance: 151, radiusMeters: 100, accuracy: 50), isFalse);
    });

    test('measures about 111 km for one degree of latitude', () {
      final meters = GeofenceCalculator.distanceMeters(
        fromLatitude: 28.6139, fromLongitude: 77.2090, toLatitude: 29.6139, toLongitude: 77.2090,
      );
      expect(meters, closeTo(111195, 200));
    });

    test('formats short distances in metres and long ones in kilometres', () {
      expect(GeofenceCalculator.formatDistance(42.4), '42m');
      expect(GeofenceCalculator.formatDistance(1500), '1.5km');
    });
  });

  group('userMessage', () {
    test('shows the message of a known app error', () {
      expect(userMessage(const NetworkException('No internet connection.')), 'No internet connection.');
      expect(userMessage(const AuthException('Session expired.', statusCode: 401)), 'Session expired.');
    });

    test('hides the details of anything unexpected', () {
      expect(userMessage(StateError('secret internals')), 'Something went wrong. Please try again.');
    });
  });
}
