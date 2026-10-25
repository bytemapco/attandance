import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Clean enterprise canvas background shared across screens.
class AnimatedBackground extends StatelessWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: SasColors.bgPrimary,
      child: child,
    );
  }
}
