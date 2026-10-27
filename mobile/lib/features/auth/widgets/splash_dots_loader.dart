import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Animated three-dot pulsing loader for splash screen.
class SplashDotsLoader extends AnimatedWidget {
  const SplashDotsLoader({
    super.key,
    required AnimationController controller,
  }) : super(listenable: controller);

  AnimationController get _controller => listenable as AnimationController;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        final start = (i * 0.2).clamp(0.0, 0.6);
        final end = (start + 0.4).clamp(0.0, 1.0);
        final anim = CurvedAnimation(
          parent: _controller,
          curve: Interval(
            start,
            end,
            curve: Curves.easeInOut,
          ),
        );
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 3),
          child: AnimatedBuilder(
            animation: anim,
            builder: (_, __) => Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: SasColors.osageOrange.withValues(
                  alpha: 0.3 + 0.7 * anim.value,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
