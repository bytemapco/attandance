import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/shared/widgets/glass_bottom_nav.dart';

class ShellScaffold extends StatelessWidget {
  final Widget child;
  const ShellScaffold({super.key, required this.child});

  static const _tabPaths = ['/home', '/history', '/analytics', '/more'];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final currentIndex = _tabPaths.indexOf(location).clamp(0, 3);

    return Scaffold(
      body: child,
      bottomNavigationBar: GlassBottomNav(
        currentIndex: currentIndex,
        onTap: (index) => context.go(_tabPaths[index]),
      ),
    );
  }
}
