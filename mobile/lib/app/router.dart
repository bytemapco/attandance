import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/app_routes.dart';
import 'package:smart_attendance_app/app/router_redirect.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';

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
      if (token != null &&
          token.isNotEmpty &&
          state.uri.path != '/reset-password') {
        return '/reset-password?token=$token';
      }
      if (state.uri.path == '/') return '/splash';
      return computeRouterRedirect(
        path: state.uri.path,
        status: ref.read(authProvider).status,
      );
    },
    routes: buildAppRoutes(
      rootNavKey: rootNavigatorKey,
      shellNavKey: shellNavigatorKey,
    ),
  );
});

