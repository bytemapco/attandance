import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Plain app canvas. Kept as a wrapper so screens need no changes.
class AnimatedBackground extends StatelessWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ColoredBox(
      color: isDark ? SasColors.darkCanvas : SasColors.lightCanvas,
      child: child,
    );
  }
}
