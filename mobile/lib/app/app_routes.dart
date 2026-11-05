import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/page_transitions.dart';
import 'package:smart_attendance_app/app/shell_scaffold.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/analytics/screens/analytics_screen.dart';
import 'package:smart_attendance_app/features/analytics/screens/leaderboard_screen.dart';
import 'package:smart_attendance_app/features/attendance/screens/flagged_detail_screen.dart';
import 'package:smart_attendance_app/features/attendance/screens/result_screen.dart';
import 'package:smart_attendance_app/features/attendance/screens/verification_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/force_change_password_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/login_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/reset_password_screen.dart';
import 'package:smart_attendance_app/features/auth/screens/splash_screen.dart';
import 'package:smart_attendance_app/features/history/screens/history_screen.dart';
import 'package:smart_attendance_app/features/history/screens/subject_detail_screen.dart';
import 'package:smart_attendance_app/features/home/screens/home_screen.dart';
import 'package:smart_attendance_app/features/leave/screens/leave_history_screen.dart';
import 'package:smart_attendance_app/features/leave/screens/leave_requests_screen.dart';
import 'package:smart_attendance_app/features/notifications/screens/notifications_screen.dart';
import 'package:smart_attendance_app/features/profile/screens/profile_screen.dart';
import 'package:smart_attendance_app/features/registration/screens/face_registration_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/help_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/notification_prefs_screen.dart';
import 'package:smart_attendance_app/features/settings/screens/sync_status_screen.dart';
import 'package:smart_attendance_app/features/smart_pass/screens/smart_pass_screen.dart';
import 'package:smart_attendance_app/features/timetable/screens/timetable_screen.dart';

List<RouteBase> buildAppRoutes({
  required GlobalKey<NavigatorState> rootNavKey,
  required GlobalKey<NavigatorState> shellNavKey,
}) {
  return [
    GoRoute(path: '/', redirect: (_, __) => '/splash'),
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/reset-password',
      pageBuilder: (context, state) => slideUpPage(
        key: state.pageKey,
        child: ResetPasswordScreen(
          token: state.uri.queryParameters['token'] ?? '',
        ),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      path: '/change-password',
      builder: (_, __) => const ForceChangePasswordScreen(),
    ),
    GoRoute(
      path: '/register-face',
      builder: (_, __) => const FaceRegistrationScreen(),
    ),
    ShellRoute(
      navigatorKey: shellNavKey,
      builder: (context, state, child) => ShellScaffold(child: child),
      routes: [
        GoRoute(
          path: '/home',
          pageBuilder: (_, state) =>
              NoTransitionPage(key: state.pageKey, child: const HomeScreen()),
        ),
        GoRoute(
          path: '/timetable',
          pageBuilder: (_, state) => NoTransitionPage(
            key: state.pageKey,
            child: const TimetableScreen(),
          ),
        ),
        GoRoute(
          path: '/history',
          pageBuilder: (_, state) => NoTransitionPage(
            key: state.pageKey,
            child: const HistoryScreen(),
          ),
        ),
        GoRoute(
          path: '/analytics',
          pageBuilder: (_, state) => NoTransitionPage(
            key: state.pageKey,
            child: const AnalyticsScreen(),
          ),
        ),
        GoRoute(
          path: '/more',
          pageBuilder: (_, state) => NoTransitionPage(
            key: state.pageKey,
            child: const ProfileScreen(),
          ),
        ),
      ],
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/verify/:sessionId',
      pageBuilder: (context, state) => slideUpPage(
        key: state.pageKey,
        child: VerificationScreen(
          sessionId: state.pathParameters['sessionId']!,
        ),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/result',
      pageBuilder: (context, state) => slideUpPage(
        key: state.pageKey,
        child: const ResultScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/notifications',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: const NotificationsScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/flagged/:attendanceId',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: FlaggedDetailScreen(
          item: state.extra as AttendanceHistoryItem?,
          attendanceId: state.pathParameters['attendanceId']!,
        ),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/leaderboard',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: const LeaderboardScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/subject/:courseSectionId',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: SubjectDetailScreen(
          courseSectionId: state.pathParameters['courseSectionId']!,
        ),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/settings/notifications',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: const NotificationPrefsScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/settings/help',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: const HelpScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/settings/sync',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: const SyncStatusScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/smart-pass',
      pageBuilder: (context, state) => slideUpPage(
        key: state.pageKey,
        child: const SmartPassScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/leave/request',
      pageBuilder: (context, state) => slideUpPage(
        key: state.pageKey,
        child: const LeaveRequestsScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
    GoRoute(
      parentNavigatorKey: rootNavKey,
      path: '/leave/history',
      pageBuilder: (context, state) => slideRightPage(
        key: state.pageKey,
        child: const LeaveHistoryScreen(),
        reduceMotion: MediaQuery.disableAnimationsOf(context),
      ),
    ),
  ];
}
