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
    this.borderRadius = 10,
    this.onTap,
    this.borderColor,
    this.backgroundColor,
    this.enableBlur = false,
  });

  @override
  Widget build(BuildContext context) {
    final decoration = BoxDecoration(
      color: backgroundColor ?? SasColors.bgSecondary,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? SasColors.glassBorder,
        width: 1.0,
      ),
      boxShadow: const [
        BoxShadow(
          color: Color(0x06000000),
          blurRadius: 4,
          offset: Offset(0, 1),
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
