import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';

class TimetableWeekHeader extends StatelessWidget {
  final DateTime weekStart;
  final bool isCurrentWeek;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onToday;

  const TimetableWeekHeader({
    super.key,
    required this.weekStart,
    required this.isCurrentWeek,
    required this.onPrevious,
    required this.onNext,
    required this.onToday,
  });

  String get _range {
    final end = weekStart.add(const Duration(days: 5));
    final sameMonth = weekStart.month == end.month;
    final start = DateFormat(sameMonth ? 'd' : 'd MMM').format(weekStart);
    return '$start – ${DateFormat('d MMM').format(end)}';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          tooltip: 'Previous week',
          onPressed: onPrevious,
          icon: const Icon(Icons.chevron_left_rounded),
        ),
        Expanded(
          child: Column(
            children: [
              Text(
                isCurrentWeek ? 'This week' : _range,
                style: TextStyle(
                  color: SasColors.textPrimaryOf(context),
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (isCurrentWeek)
                Text(
                  _range,
                  style: TextStyle(
                    color: SasColors.textMutedOf(context),
                    fontSize: 12,
                  ),
                )
              else
                TextButton(
                  onPressed: onToday,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(0, 28),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    foregroundColor: SasColors.copperStrong,
                  ),
                  child: const Text(
                    'Back to today',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Next week',
          onPressed: onNext,
          icon: const Icon(Icons.chevron_right_rounded),
        ),
      ],
    );
  }
}
