import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/pulsing_dot.dart';
import 'package:smart_attendance_app/shared/widgets/status_chip.dart';

/// Top header row of a class session card showing course code and live/scheduled status.
class ClassSessionHeader extends StatelessWidget {
  final String courseCode;
  final bool isActive;
  final bool isMarked;
  final bool isWindowClosed;

  const ClassSessionHeader({
    super.key,
    required this.courseCode,
    required this.isActive,
    required this.isMarked,
    required this.isWindowClosed,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        if (courseCode.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
            decoration: BoxDecoration(
              color: SasColors.osageOrange.withValues(alpha: isDark ? 0.2 : 0.12),
              borderRadius: BorderRadius.circular(7),
              border: Border.all(
                color: SasColors.osageOrange.withValues(alpha: 0.25),
                width: 0.8,
              ),
            ),
            child: Text(
              courseCode,
              style: const TextStyle(
                color: SasColors.osageOrange,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.3,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
        const Spacer(),
        if (isActive) ...[
          if (isMarked)
            const StatusChip(label: 'SUBMITTED', color: SasColors.accentEmerald)
          else if (isWindowClosed)
            const StatusChip(label: 'CLOSED', color: SasColors.danger)
          else
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                PulsingDot(),
                SizedBox(width: 5),
                StatusChip(label: 'LIVE', color: SasColors.accentEmerald),
              ],
            ),
        ] else ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
            decoration: BoxDecoration(
              color: isDark ? const Color(0x14FFFFFF) : const Color(0x08000000),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: isDark ? const Color(0x2EBAC0BE) : const Color(0x1EBAC0BE),
                width: 0.8,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.schedule_rounded,
                  size: 11,
                  color: isDark ? SasColors.maidenMist : SasColors.textMuted,
                ),
                const SizedBox(width: 4),
                Text(
                  'SCHEDULED',
                  style: TextStyle(
                    color: isDark ? SasColors.maidenMist : SasColors.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
