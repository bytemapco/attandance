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
        color: isDark ? const Color(0xFF142E47) : const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF0369A1) : const Color(0xFFBAE6FD),
          width: 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: Color(0xFF0284C7),
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Most universities require 75% attendance.\nSetting a higher target can give you a safety buffer.',
              style: SasTypography.style(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFBAE6FD) : const Color(0xFF0369A1),
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
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2838) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF332314) : const Color(0xFFFFEDD5),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFFEA580C),
                  size: 22,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Recommended target',
              style: SasTypography.style(
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
                color: primaryTextColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
