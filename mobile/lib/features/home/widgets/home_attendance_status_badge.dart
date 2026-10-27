import 'package:flutter/material.dart';

/// Status badge showing "Good Standing" or "Below 75%" with icon.
class HomeAttendanceStatusBadge extends StatelessWidget {
  final bool isCompliant;
  final Color statusColor;
  final bool isDark;

  const HomeAttendanceStatusBadge({
    super.key,
    required this.isCompliant,
    required this.statusColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: statusColor.withValues(alpha: isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.30),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isCompliant
                ? Icons.check_circle_rounded
                : Icons.warning_amber_rounded,
            size: 12,
            color: statusColor,
          ),
          const SizedBox(width: 5),
          Text(
            isCompliant ? 'Good Standing' : 'Below 75%',
            style: TextStyle(
              color: statusColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }
}
