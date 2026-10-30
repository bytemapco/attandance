import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
            ? (isDark ? const Color(0xFF3F1D24) : const Color(0xFFFFF1F2))
            : (isDark ? const Color(0xFF143828) : const Color(0xFFF0FDF4)),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isBelow
              ? (isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFECDD3))
              : (isDark ? const Color(0xFF15803D) : const Color(0xFFBBF7D0)),
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
            color: isBelow ? const Color(0xFFEF4444) : const Color(0xFF16A34A),
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
                    ? const Color(0xFFE11D48)
                    : const Color(0xFF16A34A),
                height: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
