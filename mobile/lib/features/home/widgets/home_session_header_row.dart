import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

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
            color: const Color(0xFFFFEDD5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            courseCode,
            style: SasTypography.style(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFEA580C),
            ),
          ),
        ),
        if (isSessionOn)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF16A34A),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'LIVE',
                  style: SasTypography.style(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF16A34A),
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
