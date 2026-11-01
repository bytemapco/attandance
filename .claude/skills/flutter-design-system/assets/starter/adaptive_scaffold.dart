import 'package:flutter/material.dart';

class AdaptiveScaffold extends StatelessWidget {
  const AdaptiveScaffold({
    required this.compact,
    required this.expanded,
    this.breakpoint = 840,
    super.key,
  });

  final Widget compact;
  final Widget expanded;
  final double breakpoint;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return constraints.maxWidth < breakpoint ? compact : expanded;
      },
    );
  }
}
