import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Clean elevated surface card with subtle drop shadow and crisp enterprise border.
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
    this.borderRadius = 18,
    this.onTap,
    this.borderColor,
    this.backgroundColor,
    this.enableBlur = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBg = isDark ? SasColors.darkSurface : SasColors.lightSurface;
    final defaultBorder = isDark ? const Color(0x2EBAC0BE) : const Color(0x24BAC0BE);

    final decoration = BoxDecoration(
      color: backgroundColor ?? defaultBg,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? defaultBorder,
        width: 1.0,
      ),
      boxShadow: [
        BoxShadow(
          color: isDark ? const Color(0x33000000) : const Color(0x0A000000),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: isDark ? const Color(0x1F000000) : const Color(0x05000000),
          blurRadius: 4,
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
          splashColor: SasColors.glassBgHover,
          child: content,
        ),
      );
    }
    return content;
  }
}
