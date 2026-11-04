import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Card with bullseye badge, big target percentage number, and orange slider.
class GoalsSliderCard extends StatelessWidget {
  final double targetVal;
  final ValueChanged<double> onChanged;

  const GoalsSliderCard({
    super.key,
    required this.targetVal,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isDark
                      ? SasColors.darkWarningSoft
                      : SasColors.copperSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Icon(
                    Icons.track_changes_rounded,
                    color: SasColors.copperStrong,
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Minimum attendance',
                style: SasTypography.style(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Big Percentage Number
          Center(
            child: Text(
              '${targetVal.toStringAsFixed(0)}%',
              style: SasTypography.style(
                fontSize: 48,
                fontWeight: FontWeight.w600,
                color: primaryTextColor,
                height: 1.0,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Custom Orange Slider
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 7,
              activeTrackColor: SasColors.copper,
              inactiveTrackColor: isDark
                  ? SasColors.textSecondary
                  : SasColors.ivory,
              thumbColor: SasColors.copper,
              thumbShape: const RoundSliderThumbShape(
                enabledThumbRadius: 11,
                elevation: 4,
              ),
              overlayColor: SasColors.copper.withValues(alpha: 0.15),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 20),
            ),
            child: Slider(
              value: targetVal.clamp(50.0, 100.0),
              min: 50.0,
              max: 100.0,
              divisions: 50,
              onChanged: onChanged,
            ),
          ),
          const SizedBox(height: 6),

          // 50% | 75% Recommended | 100% Labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '50%',
                style: SasTypography.style(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: subtitleColor,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '75% ',
                    style: SasTypography.style(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: SasColors.copper,
                    ),
                  ),
                  Text(
                    'Recommended',
                    style: SasTypography.style(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: subtitleColor,
                    ),
                  ),
                ],
              ),
              Text(
                '100%',
                style: SasTypography.style(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: subtitleColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
