import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Flat surface with a hairline border. Depth comes from the surface step,
/// not from shadows or gradients.
class SurfaceCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final VoidCallback? onTap;
  final Color? borderColor;
  final Color? backgroundColor;

  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 12,
    this.onTap,
    this.borderColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBg = isDark ? SasColors.darkSurface : SasColors.lightSurface;
    final defaultBorder = isDark
        ? SasColors.darkBorder
        : SasColors.border;
    final radius = BorderRadius.circular(borderRadius);
    final decoration = BoxDecoration(
      color: backgroundColor ?? defaultBg,
      borderRadius: radius,
      border: Border.all(color: borderColor ?? defaultBorder),
    );

    if (onTap == null) {
      return Container(padding: padding, decoration: decoration, child: child);
    }
    return Material(
      color: Colors.transparent,
      borderRadius: radius,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        child: Ink(
          decoration: decoration,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}
