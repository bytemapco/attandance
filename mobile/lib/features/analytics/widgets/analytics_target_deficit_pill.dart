import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

class AnalyticsTargetDeficitPill extends StatelessWidget {
  final bool isBelow;
  final bool isDark;
  final double diff;

  const AnalyticsTargetDeficitPill({
    super.key,
    required this.isBelow,
    required this.isDark,
    required this.diff,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isBelow
            ? (isDark ? SasColors.darkDangerSoft : SasColors.dangerSoft)
            : (isDark ? SasColors.darkSuccessSoft : SasColors.successSoft),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isBelow
              ? (isDark ? SasColors.danger : SasColors.dangerBorder)
              : (isDark ? SasColors.success : SasColors.successBorder),
          width: 1.0,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isBelow
                ? Icons.warning_amber_rounded
                : Icons.check_circle_outline_rounded,
            size: 18,
            color: isBelow ? SasColors.danger : SasColors.success,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              isBelow
                  ? '${diff.toStringAsFixed(0)} percentage points\nbelow target'
                  : 'Target met\nsuccessfully',
              style: SasTypography.style(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isBelow
                    ? SasColors.danger
                    : SasColors.success,
                height: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
