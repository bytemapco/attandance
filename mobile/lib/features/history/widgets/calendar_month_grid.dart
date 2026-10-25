import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/extensions.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

class CalendarMonthGrid extends StatelessWidget {
  final DateTime focusedMonth;
  final DateTime selectedDate;
  final Map<DateTime, List<AttendanceHistoryItem>> grouped;
  final ValueChanged<DateTime> onSelectDate;

  const CalendarMonthGrid({
    super.key,
    required this.focusedMonth,
    required this.selectedDate,
    required this.grouped,
    required this.onSelectDate,
  });

  @override
  Widget build(BuildContext context) {
    final firstDay = DateTime(focusedMonth.year, focusedMonth.month, 1);
    final daysInMonth = DateTime(focusedMonth.year, focusedMonth.month + 1, 0).day;
    final startWeekday = firstDay.weekday;
    final cells = <Widget>[];

    for (int i = 1; i < startWeekday; i++) {
      cells.add(const SizedBox());
    }

    for (int day = 1; day <= daysInMonth; day++) {
      final date = DateTime(focusedMonth.year, focusedMonth.month, day);
      final items = grouped[date];
      final isSelected = date.isSameDay(selectedDate);
      final isToday = date.isSameDay(DateTime.now());

      Color? dotColor;
      if (items != null && items.isNotEmpty) {
        final statuses = items.map((i) => i.status).toSet();
        if (statuses.contains('Flagged')) {
          dotColor = SasColors.warning;
        } else if (statuses.every((s) => s == 'Present' || s == 'Approved')) {
          dotColor = SasColors.accentEmerald;
        } else {
          dotColor = SasColors.danger;
        }
      }

      cells.add(
        GestureDetector(
          onTap: () => onSelectDate(date),
          child: Container(
            margin: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              color: isSelected
                  ? SasColors.accentEmerald.withValues(alpha: 0.12)
                  : isToday
                      ? SasColors.bgCanvas
                      : null,
              border: isSelected
                  ? Border.all(color: SasColors.accentEmerald.withValues(alpha: 0.5))
                  : isToday
                      ? Border.all(color: SasColors.glassBorder)
                      : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$day',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? SasColors.accentEmerald : SasColors.textPrimary,
                  ),
                ),
                if (dotColor != null)
                  Container(
                    width: 5,
                    height: 5,
                    margin: const EdgeInsets.only(top: 2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: dotColor,
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 0.95,
      children: cells,
    );
  }
}
