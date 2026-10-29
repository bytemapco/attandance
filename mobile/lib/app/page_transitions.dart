import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Slide-up transition for modal-style screens (verification, leave request, smart pass).
Page<void> slideUpPage({required LocalKey key, required Widget child}) {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return CupertinoPage<void>(key: key, child: child, fullscreenDialog: true);
  }
  return CustomTransitionPage(
    key: key,
    child: child,
    transitionDuration: SasDurations.slow,
    reverseTransitionDuration: SasDurations.slow,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.15),
          end: Offset.zero,
        ).animate(curved),
        child: FadeTransition(opacity: curved, child: child),
      );
    },
  );
}

/// Slide-right transition for detail/settings screens with iOS interactive back swipe.
Page<void> slideRightPage({required LocalKey key, required Widget child}) {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return CupertinoPage<void>(key: key, child: child);
  }
  return CustomTransitionPage(
    key: key,
    child: child,
    transitionDuration: SasDurations.slow,
    reverseTransitionDuration: SasDurations.slow,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0.25, 0),
          end: Offset.zero,
        ).animate(curved),
        child: FadeTransition(opacity: curved, child: child),
      );
    },
  );
}
