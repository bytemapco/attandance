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
    final colors = _resolveColors(context);
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
          const SizedBox(width: 8),
        ] else if (icon != null) ...[
          Icon(icon, size: 17, color: colors.foreground),
          const SizedBox(width: 7),
        ],
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: fontSize ?? 14.5,
              fontWeight: FontWeight.w600,
              color: colors.foreground,
              letterSpacing: -0.1,
            ),
          ),
        ),
      ],
    );

    return AnimatedOpacity(
      opacity: disabled ? 0.45 : 1.0,
      duration: SasDurations.fast,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: disabled ? null : onPressed,
        child: Material(
          color: Colors.transparent,
          child: Ink(
            height: height ?? 48,
            decoration: BoxDecoration(
              color: colors.background,
              borderRadius: BorderRadius.circular(14),
              border: colors.border != Colors.transparent
                  ? Border.all(color: colors.border)
                  : null,
              boxShadow: colors.shadow,
            ),
            child: InkWell(
              onTap: disabled ? null : onPressed,
              borderRadius: BorderRadius.circular(14),
              splashColor: colors.foreground.withValues(alpha: 0.08),
              highlightColor: colors.foreground.withValues(alpha: 0.04),
              child: Padding(
                padding: padding ??
                    const EdgeInsets.symmetric(horizontal: 16),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }

  _ButtonColors _resolveColors(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (variant) {
      case GlassButtonVariant.primary:
        return _ButtonColors(
          background: SasColors.osageOrange,
          foreground: Colors.white,  // Fixed: was darkCanvas (2.8:1 fail)
          border: Colors.transparent,
          shadow: [
            BoxShadow(
              color: SasColors.osageOrange.withValues(alpha: 0.35),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        );
      case GlassButtonVariant.secondary:
        return _ButtonColors(
          background: isDark
              ? SasColors.darkElevated
              : SasColors.lightSurface,
          foreground: isDark ? SasColors.brilliance : SasColors.indianInk,
          border: isDark
              ? const Color(0x1EFFFFFF)
              : const Color(0x18000000),
          shadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        );
      case GlassButtonVariant.danger:
        return _ButtonColors(
          background: SasColors.danger,
          foreground: Colors.white,
          border: Colors.transparent,
          shadow: [
            BoxShadow(
              color: SasColors.danger.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        );
      case GlassButtonVariant.ghost:
        return _ButtonColors(
          background: Colors.transparent,
          foreground:
              isDark ? SasColors.maidenMist : SasColors.textSecondary,
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
