import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

enum AppButtonVariant { primary, secondary, danger, ghost }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool isExpanded;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final double? fontSize;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
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
              borderRadius: BorderRadius.circular(12),
              border: colors.border != Colors.transparent
                  ? Border.all(color: colors.border)
                  : null,
            ),
            child: InkWell(
              onTap: disabled ? null : onPressed,
              borderRadius: BorderRadius.circular(12),
              splashColor: colors.foreground.withValues(alpha: 0.08),
              highlightColor: colors.foreground.withValues(alpha: 0.04),
              child: Padding(
                padding: padding ?? const EdgeInsets.symmetric(horizontal: 16),
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
      case AppButtonVariant.primary:
        return _ButtonColors(
          background: isDark ? SasColors.ivory : SasColors.carbon,
          foreground: isDark ? SasColors.ink : Colors.white,
          border: Colors.transparent,
        );
      case AppButtonVariant.secondary:
        return _ButtonColors(
          background: isDark ? SasColors.darkElevated : SasColors.lightSurface,
          foreground: isDark ? SasColors.ivory : SasColors.ink,
          border: isDark ? SasColors.darkBorder : SasColors.border,
        );
      case AppButtonVariant.danger:
        return _ButtonColors(
          background: SasColors.danger,
          foreground: Colors.white,
          border: Colors.transparent,
        );
      case AppButtonVariant.ghost:
        return _ButtonColors(
          background: Colors.transparent,
          foreground: isDark ? SasColors.mutedOnDark : SasColors.textSecondary,
          border: Colors.transparent,
        );
    }
  }
}

class _ButtonColors {
  final Color background;
  final Color foreground;
  final Color border;

  const _ButtonColors({
    required this.background,
    required this.foreground,
    required this.border,
  });
}
