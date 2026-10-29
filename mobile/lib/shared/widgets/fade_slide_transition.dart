import 'package:flutter/material.dart';

/// Lightweight micro-animation wrapper for smooth staggered entrance transitions.
class FadeSlideTransition extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final Offset beginOffset;
  final Curve curve;

  const FadeSlideTransition({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 320),
    this.beginOffset = const Offset(0, 0.08),
    this.curve = Curves.easeOutCubic,
  });

  @override
  State<FadeSlideTransition> createState() => _FadeSlideTransitionState();
}

class _FadeSlideTransitionState extends State<FadeSlideTransition>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);

    final curved = CurvedAnimation(parent: _controller, curve: widget.curve);

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(curved);
    _slideAnimation = Tween<Offset>(
      begin: widget.beginOffset,
      end: Offset.zero,
    ).animate(curved);

    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      Future.delayed(widget.delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(position: _slideAnimation, child: widget.child),
    );
  }
}
