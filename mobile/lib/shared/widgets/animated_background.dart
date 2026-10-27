import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// App-wide canvas with a subtle ambient gradient that gives every
/// screen a sense of warmth and depth.
class AnimatedBackground extends StatelessWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        gradient: isDark
            ? const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0F2035), // slightly lighter navy at top-left
                  SasColors.darkCanvas, // pure navy
                  Color(0xFF0A1520), // deeper at bottom-right
                ],
                stops: [0.0, 0.5, 1.0],
              )
            : const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFFFFDF9), // warm ivory cream
                  Color(0xFFFFF3EB), // gentle peach glow
                  Color(0xFFFBF4ED), // soft warm sand
                ],
                stops: [0.0, 0.5, 1.0],
              ),
      ),
      child: child,
    );
  }
}
