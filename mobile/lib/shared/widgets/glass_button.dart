import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

enum GlassButtonVariant { primary, secondary, danger, ghost }

class GlassButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final GlassButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool isExpanded;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final double? fontSize;

  const GlassButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = GlassButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.isExpanded = false,
    this.height,
    this.padding,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _resolveColors();
    final disabled = onPressed == null || isLoading;

    Widget child = Row(
      mainAxisSize: isExpanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2.0,
              valueColor: AlwaysStoppedAnimation<Color>(colors.foreground),
            ),
          ),
          const SizedBox(width: 6),
        ] else if (icon != null) ...[
          Icon(icon, size: 16, color: colors.foreground),
          const SizedBox(width: 6),
        ],
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: fontSize ?? 14,
              fontWeight: FontWeight.w600,
              color: colors.foreground,
              letterSpacing: -0.01,
            ),
          ),
        ),
      ],
    );

    return AnimatedOpacity(
      opacity: disabled ? 0.5 : 1.0,
      duration: SasDurations.fast,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: disabled ? null : onPressed,
        child: Material(
          color: Colors.transparent,
          child: Ink(
            height: height ?? 46,
            decoration: BoxDecoration(
              color: colors.background,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: colors.border),
              boxShadow: colors.shadow,
            ),
            child: InkWell(
              onTap: disabled ? null : onPressed,
              borderRadius: BorderRadius.circular(10),
              splashColor: colors.foreground.withValues(alpha: 0.1),
              child: Padding(
                padding: padding ?? const EdgeInsets.symmetric(horizontal: 14),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }

  _ButtonColors _resolveColors() {
    switch (variant) {
      case GlassButtonVariant.primary:
        return const _ButtonColors(
          background: SasColors.accentEmerald,
          foreground: Colors.white,
          border: Colors.transparent,
          shadow: [
            BoxShadow(
              color: Color(0x18059669),
              blurRadius: 4,
              offset: Offset(0, 1),
            ),
          ],
        );
      case GlassButtonVariant.secondary:
        return const _ButtonColors(
          background: SasColors.bgSecondary,
          foreground: SasColors.textPrimary,
          border: SasColors.glassBorder,
          shadow: [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 2,
              offset: Offset(0, 1),
            ),
          ],
        );
      case GlassButtonVariant.danger:
        return const _ButtonColors(
          background: SasColors.danger,
          foreground: Colors.white,
          border: Colors.transparent,
          shadow: [
            BoxShadow(
              color: Color(0x18DC2626),
              blurRadius: 4,
              offset: Offset(0, 1),
            ),
          ],
        );
      case GlassButtonVariant.ghost:
        return const _ButtonColors(
          background: Colors.transparent,
          foreground: SasColors.textSecondary,
          border: Colors.transparent,
          shadow: null,
        );
    }
  }
}

class _ButtonColors {
  final Color background;
  final Color foreground;
  final Color border;
  final List<BoxShadow>? shadow;

  const _ButtonColors({
    required this.background,
    required this.foreground,
    required this.border,
    this.shadow,
  });
}
