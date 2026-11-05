import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/shared/widgets/app_bottom_nav.dart';

class ShellScaffold extends StatelessWidget {
  final Widget child;
  const ShellScaffold({super.key, required this.child});

  static const _tabPaths = [
    '/home',
    '/timetable',
    '/history',
    '/analytics',
    '/more',
  ];

  int _calculateIndex(String location) {
    final index = _tabPaths.indexWhere(location.startsWith);
    return index < 0 ? 0 : index;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final currentIndex = _calculateIndex(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: AppBottomNav(
        currentIndex: currentIndex,
        onTap: (index) => context.go(_tabPaths[index]),
      ),
    );
  }
}
