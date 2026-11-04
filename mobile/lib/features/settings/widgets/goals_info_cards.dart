import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Blue info callout card explaining university target requirements.
class GoalsInfoCallout extends StatelessWidget {
  final bool isDark;

  const GoalsInfoCallout({super.key, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkInfoSoft : SasColors.infoSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.info : SasColors.infoBorder,
          width: 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: SasColors.info,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Most universities require 75% attendance.\nSetting a higher target can give you a safety buffer.',
              style: SasTypography.style(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: isDark
                    ? SasColors.infoBorder
                    : SasColors.info,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Tappable card to quickly select the recommended 75% target.
class GoalsRecommendedCard extends StatelessWidget {
  final bool isDark;
  final VoidCallback onTap;

  const GoalsRecommendedCard({
    super.key,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? SasColors.darkSurface : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
            width: 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: isDark
                    ? SasColors.darkWarningSoft
                    : SasColors.copperSoft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Icon(
                  Icons.check_circle_rounded,
                  color: SasColors.copperStrong,
                  size: 22,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Recommended target',
              style: SasTypography.style(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: primaryTextColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
