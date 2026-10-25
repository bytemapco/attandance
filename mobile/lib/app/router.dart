import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/page_transitions.dart';
import 'package:smart_attendance_app/app/router_redirect.dart';
import 'package:smart_attendance_app/app/shell_scaffold.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/auth/screens/force_change_password_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/login_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/reset_password_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/splash_screen.dart';
import 'package:smart_attendance_app/features/registration/screens/face_registration_screen.dart';
import 'package:smart_attendance_app/features/home/screens/home_screen.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_screen.dart';
import 'package:smart_attendance_app/features/attendance/screens/result_screen.dart';
import 'package:smart_attendance_app/features/attendance/screens/flagged_detail_screen.dart';
import 'package:smart_attendance_app/features/history/screens/history_screen.dart';
import 'package:smart_attendance_app/features/history/screens/subject_detail_screen.dart';
import 'package:smart_attendance_app/features/notifications/screens/notifications_screen.dart';
import 'package:smart_attendance_app/features/analytics/screens/analytics_screen.dart';
import 'package:smart_attendance_app/features/analytics/screens/leaderboard_screen.dart';
import 'package:smart_attendance_app/features/profile/screens/profile_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/goals_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/notification_prefs_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/help_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/sync_status_screen.dart';
import 'package:smart_attendance_app/features/smart_pass/screens/smart_pass_screen.dart';
import 'package:smart_attendance_app/features/leave/screens/leave_requests_screen.dart';
import 'package:smart_attendance_app/features/leave/screens/leave_history_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();
final shellNavigatorKey = GlobalKey<NavigatorState>();

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  final notifier = RouterNotifier();
  ref.listen(authProvider, (previous, next) {
    if (previous?.status != next.status) notifier.notify();
  });
  return notifier;
});

class RouterNotifier extends ChangeNotifier {
  void notify() => notifyListeners();
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.read(routerNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final token = state.uri.queryParameters['token'];
      if (token != null && token.isNotEmpty && state.uri.path != '/reset-password') {
        return '/reset-password?token=$token';
      }
      if (state.uri.path == '/') return '/splash';
      return computeRouterRedirect(
        path: state.uri.path,
        status: ref.read(authProvider).status,
      );
    },
    routes: [
      GoRoute(path: '/', redirect: (_, __) => '/splash'),
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/reset-password',
        pageBuilder: (_, state) => slideUpPage(
          key: state.pageKey,
          child: ResetPasswordScreen(token: state.uri.queryParameters['token'] ?? ''),
        ),
      ),
      GoRoute(path: '/change-password', builder: (_, __) => const ForceChangePasswordScreen()),
      GoRoute(path: '/register-face', builder: (_, __) => const FaceRegistrationScreen()),
      ShellRoute(
        navigatorKey: shellNavigatorKey,
        builder: (context, state, child) => ShellScaffold(child: child),
        routes: [
          GoRoute(path: '/home', pageBuilder: (_, state) => NoTransitionPage(key: state.pageKey, child: const HomeScreen())),
          GoRoute(path: '/history', pageBuilder: (_, state) => NoTransitionPage(key: state.pageKey, child: const HistoryScreen())),
          GoRoute(path: '/analytics', pageBuilder: (_, state) => NoTransitionPage(key: state.pageKey, child: const AnalyticsScreen())),
          GoRoute(path: '/more', pageBuilder: (_, state) => NoTransitionPage(key: state.pageKey, child: const ProfileScreen())),
        ],
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/verify/:sessionId',
        pageBuilder: (context, state) => slideUpPage(
          key: state.pageKey,
          child: VerificationScreen(sessionId: state.pathParameters['sessionId']!),
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/result',
        pageBuilder: (_, state) => slideUpPage(key: state.pageKey, child: const ResultScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/notifications',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const NotificationsScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/flagged/:attendanceId',
        pageBuilder: (context, state) => slideRightPage(
          key: state.pageKey,
          child: FlaggedDetailScreen(
            item: state.extra as AttendanceHistoryItem?,
            attendanceId: state.pathParameters['attendanceId']!,
          ),
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/leaderboard',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const LeaderboardScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/subject/:classId',
        pageBuilder: (_, state) => slideRightPage(
          key: state.pageKey,
          child: SubjectDetailScreen(classId: state.pathParameters['classId']!),
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/settings/goals',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const GoalsScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/settings/notifications',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const NotificationPrefsScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/settings/help',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const HelpScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/settings/sync',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const SyncStatusScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/smart-pass',
        pageBuilder: (_, state) => slideUpPage(key: state.pageKey, child: const SmartPassScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/leave/request',
        pageBuilder: (_, state) => slideUpPage(key: state.pageKey, child: const LeaveRequestsScreen()),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/leave/history',
        pageBuilder: (_, state) => slideRightPage(key: state.pageKey, child: const LeaveHistoryScreen()),
      ),
    ],
  );
});
