import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Elevated surface card with a subtle inner-gradient shimmer and
/// adaptive border — no glassmorphism, just structural depth.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final VoidCallback? onTap;
  final Color? borderColor;
  final Color? backgroundColor;
  final bool enableBlur;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 20,
    this.onTap,
    this.borderColor,
    this.backgroundColor,
    this.enableBlur = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBg = isDark ? SasColors.darkSurface : SasColors.lightSurface;
    final defaultBorder = isDark
        ? const Color(0x1EFFFFFF)
        : const Color(0x14000000);
    final bg = backgroundColor ?? defaultBg;

    final decoration = BoxDecoration(
      // Micro inner-gradient: adds structural depth without glassmorphism
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark
            ? [
                Color.lerp(bg, Colors.white, 0.04)!,
                bg,
              ]
            : [
                bg,
                Color.lerp(bg, Colors.black, 0.015)!,
              ],
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? defaultBorder,
        width: 0.8,
      ),
      boxShadow: isDark
          ? [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.28),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ]
          : [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.055),
                blurRadius: 12,
                offset: const Offset(0, 3),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.025),
                blurRadius: 3,
                offset: const Offset(0, 1),
              ),
            ],
    );

    Widget content = Container(
      padding: padding,
      decoration: decoration,
      child: child,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          splashColor: SasColors.osageOrange.withValues(alpha: 0.05),
          highlightColor: SasColors.osageOrange.withValues(alpha: 0.03),
          child: Ink(
            decoration: decoration,
            child: Padding(padding: padding, child: child),
          ),
        ),
      );
    }
    return content;
  }
}
