import 'package:flutter/material.dart';

@immutable
final class AppSpacing extends ThemeExtension<AppSpacing> {
  const AppSpacing({
    this.xs = 4,
    this.sm = 8,
    this.md = 16,
    this.lg = 24,
    this.xl = 32,
  });

  final double xs;
  final double sm;
  final double md;
  final double lg;
  final double xl;

  @override
  AppSpacing copyWith({
    double? xs,
    double? sm,
    double? md,
    double? lg,
    double? xl,
  }) => AppSpacing(
    xs: xs ?? this.xs,
    sm: sm ?? this.sm,
    md: md ?? this.md,
    lg: lg ?? this.lg,
    xl: xl ?? this.xl,
  );

  @override
  AppSpacing lerp(covariant AppSpacing? other, double t) {
    if (other == null) return this;
    return AppSpacing(
      xs: lerpDouble(xs, other.xs, t),
      sm: lerpDouble(sm, other.sm, t),
      md: lerpDouble(md, other.md, t),
      lg: lerpDouble(lg, other.lg, t),
      xl: lerpDouble(xl, other.xl, t),
    );
  }

  static double lerpDouble(double a, double b, double t) => a + (b - a) * t;
}

extension AppThemeContext on BuildContext {
  AppSpacing get spacing => Theme.of(this).extension<AppSpacing>()!;
}
