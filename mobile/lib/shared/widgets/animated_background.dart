import 'package:flutter/material.dart';

/// Clean enterprise canvas background shared across screens.
class AnimatedBackground extends StatelessWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: child,
    );
  }
}
