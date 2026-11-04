import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

class HomeSessionHeaderRow extends StatelessWidget {
  final String courseCode;
  final bool isSessionOn;

  const HomeSessionHeaderRow({
    super.key,
    required this.courseCode,
    required this.isSessionOn,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: SasColors.copperSoft,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            courseCode,
            style: SasTypography.style(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: SasColors.copperStrong,
            ),
          ),
        ),
        if (isSessionOn)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: SasColors.successSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: SasColors.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'LIVE',
                  style: SasTypography.style(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: SasColors.success,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
