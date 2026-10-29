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
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2838) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
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
                      ? const Color(0xFF332314)
                      : const Color(0xFFFFEDD5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Icon(
                    Icons.track_changes_rounded,
                    color: Color(0xFFEA580C),
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
                fontWeight: FontWeight.w800,
                color: primaryTextColor,
                letterSpacing: -1.2,
                height: 1.0,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Custom Orange Slider
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 7,
              activeTrackColor: const Color(0xFFF95721),
              inactiveTrackColor: isDark
                  ? const Color(0xFF334155)
                  : const Color(0xFFF1F5F9),
              thumbColor: const Color(0xFFF95721),
              thumbShape: const RoundSliderThumbShape(
                enabledThumbRadius: 11,
                elevation: 4,
              ),
              overlayColor: const Color(0xFFF95721).withValues(alpha: 0.15),
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
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFF95721),
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
