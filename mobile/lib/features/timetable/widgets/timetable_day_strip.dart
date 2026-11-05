import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';

class DayChipData {
  final DateTime date;
  final int classCount;

  const DayChipData({required this.date, required this.classCount});
}

/// One tappable chip per teaching day of the week.
class TimetableDayStrip extends StatelessWidget {
  final List<DayChipData> days;
  final DateTime selected;
  final DateTime today;
  final ValueChanged<DateTime> onSelect;

  const TimetableDayStrip({
    super.key,
    required this.days,
    required this.selected,
    required this.today,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final day in days)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: _DayChip(
                data: day,
                isSelected: day.date == selected,
                isToday: day.date == today,
                onTap: () => onSelect(day.date),
              ),
            ),
          ),
      ],
    );
  }
}

class _DayChip extends StatelessWidget {
  final DayChipData data;
  final bool isSelected;
  final bool isToday;
  final VoidCallback onTap;

  const _DayChip({
    required this.data,
    required this.isSelected,
    required this.isToday,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fill = isSelected
        ? (isDark ? SasColors.copper : SasColors.carbon)
        : Colors.transparent;
    final onFill = isSelected
        ? (isDark ? SasColors.darkCanvas : Colors.white)
        : SasColors.textPrimaryOf(context);
    final weekday = DateFormat('EEE').format(data.date);
    final label = '$weekday ${DateFormat('d MMMM').format(data.date)}, '
        '${data.classCount} ${data.classCount == 1 ? 'class' : 'classes'}'
        '${isToday ? ', today' : ''}';

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: SasRadius.lgAll,
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: fill,
            borderRadius: SasRadius.lgAll,
            border: Border.all(
              color: isSelected
                  ? fill
                  : (isDark ? SasColors.darkBorder : SasColors.border),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                weekday,
                style: TextStyle(
                  color: isSelected ? onFill : SasColors.textMutedOf(context),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${data.date.day}',
                style: TextStyle(
                  color: onFill,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isToday
                      ? SasColors.copper
                      : data.classCount > 0
                      ? onFill.withValues(alpha: 0.45)
                      : Colors.transparent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
