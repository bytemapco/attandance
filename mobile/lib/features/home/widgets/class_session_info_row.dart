import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Row displaying teacher name and countdown timer.
class ClassSessionInfoRow extends StatelessWidget {
  final String teacherName;
  final bool isActive;
  final bool isMarked;
  final bool isWindowClosed;
  final bool isUrgent;
  final Duration? remaining;
  final bool isDark;

  const ClassSessionInfoRow({
    super.key,
    required this.teacherName,
    required this.isActive,
    required this.isMarked,
    required this.isWindowClosed,
    required this.isUrgent,
    required this.remaining,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0x14FFFFFF) : const Color(0x08000000),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.person_rounded,
            size: 12,
            color: SasColors.textSecondaryOf(context),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            teacherName,
            style: TextStyle(
              color: SasColors.textSecondaryOf(context),
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (isActive && remaining != null && !isWindowClosed && !isMarked) ...[
          AnimatedDefaultTextStyle(
            duration: SasDurations.normal,
            style: TextStyle(
              color: isUrgent ? SasColors.danger : SasColors.osageOrange,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 13,
                  color: isUrgent ? SasColors.danger : SasColors.osageOrange,
                ),
                const SizedBox(width: 4),
                Text(
                  '${remaining!.inMinutes}:${(remaining!.inSeconds % 60).toString().padLeft(2, '0')}',
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
