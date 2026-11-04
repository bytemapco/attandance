import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Sync pill showing refresh progress and its label.
class RefreshPillIndicator extends StatelessWidget {
  final bool isRefreshing;
  final double progress;
  final Animation<double> pulseAnimation;

  const RefreshPillIndicator({
    super.key,
    required this.isRefreshing,
    required this.progress,
    required this.pulseAnimation,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Opacity(
        opacity: isRefreshing ? 1.0 : progress.clamp(0.0, 1.0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkSurface : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? SasColors.darkBorderStrong : SasColors.border,
              width: 1.0,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              isRefreshing
                  ? AnimatedBuilder(
                      animation: pulseAnimation,
                      builder: (_, __) {
                        return Transform.rotate(
                          angle: pulseAnimation.value * 2 * math.pi,
                          child: const Icon(
                            Icons.sync_rounded,
                            size: 18,
                            color: SasColors.copper,
                          ),
                        );
                      },
                    )
                  : Transform.rotate(
                      angle: progress * math.pi * 1.5,
                      child: Icon(
                        progress >= 1.0
                            ? Icons.keyboard_double_arrow_down_rounded
                            : Icons.arrow_downward_rounded,
                        size: 17,
                        color: SasColors.copper,
                      ),
                    ),
              const SizedBox(width: 8),
              Text(
                isRefreshing
                    ? 'Syncing Attendance...'
                    : (progress >= 1.0
                          ? 'Release to Refresh'
                          : 'Pull to Refresh'),
                style: SasTypography.style(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? SasColors.ivory
                      : SasColors.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
