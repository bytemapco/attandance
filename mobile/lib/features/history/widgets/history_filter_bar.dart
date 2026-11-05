import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/shared/widgets/option_sheet.dart';

/// Date range, subject and status filters. Each chip opens its own picker; "Clear" resets all three.
class HistoryFilterBar extends StatelessWidget {
  final HistoryFilter filter;
  final List<SubjectFigures> subjects;
  final ValueChanged<HistoryFilter> onChanged;

  const HistoryFilterBar({
    super.key,
    required this.filter,
    required this.subjects,
    required this.onChanged,
  });

  String? get _subjectName {
    for (final subject in subjects) {
      if (subject.courseSectionId == filter.courseSectionId) {
        return subject.subjectName;
      }
    }
    return null;
  }

  String get _dateLabel {
    final from = filter.from;
    final to = filter.to;
    if (from == null || to == null) return 'All dates';
    final format = DateFormat('d MMM');
    return '${format.format(from)} – ${format.format(to)}';
  }

  Future<void> _pickDates(BuildContext context) async {
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 3),
      lastDate: now,
      initialDateRange: filter.from == null || filter.to == null
          ? null
          : DateTimeRange(start: filter.from!, end: filter.to!),
    );
    if (range == null) return;
    onChanged(
      filter.copyWith(
        from: DateTime.utc(range.start.year, range.start.month, range.start.day),
        to: DateTime.utc(range.end.year, range.end.month, range.end.day),
      ),
    );
  }

  Future<void> _pickSubject(BuildContext context) async {
    final choice = await showOptionSheet<String>(
      context,
      title: 'Subject',
      selected: filter.courseSectionId,
      options: [
        const SheetOption(value: null, label: 'All subjects'),
        for (final s in subjects)
          SheetOption(value: s.courseSectionId, label: s.subjectName, detail: s.subjectCode),
      ],
    );
    if (choice == null) return;
    onChanged(
      choice.value == null
          ? filter.copyWith(clearSubject: true)
          : filter.copyWith(courseSectionId: choice.value),
    );
  }

  Future<void> _pickStatus(BuildContext context) async {
    final choice = await showOptionSheet<AttendanceOutcome>(
      context,
      title: 'Status',
      selected: filter.outcome,
      options: [
        const SheetOption(value: null, label: 'All statuses'),
        for (final o in AttendanceOutcome.values)
          SheetOption(value: o, label: o.label),
      ],
    );
    if (choice == null) return;
    onChanged(
      choice.value == null
          ? filter.copyWith(clearOutcome: true)
          : filter.copyWith(outcome: choice.value),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        _FilterChip(
          icon: Icons.date_range_rounded,
          label: _dateLabel,
          active: filter.from != null,
          onTap: () => _pickDates(context),
        ),
        _FilterChip(
          icon: Icons.menu_book_rounded,
          label: _subjectName ?? 'All subjects',
          active: filter.courseSectionId != null,
          onTap: () => _pickSubject(context),
        ),
        _FilterChip(
          icon: Icons.fact_check_rounded,
          label: filter.outcome?.label ?? 'All statuses',
          active: filter.outcome != null,
          onTap: () => _pickStatus(context),
        ),
        if (!filter.isEmpty)
          TextButton(
            onPressed: () => onChanged(const HistoryFilter()),
            style: TextButton.styleFrom(foregroundColor: SasColors.copperStrong),
            child: const Text('Clear', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterChip({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accent = isDark ? SasColors.copper : SasColors.copperStrong;
    final color = active ? accent : SasColors.textSecondaryOf(context);
    return Semantics(
      button: true,
      selected: active,
      label: 'Filter: $label',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: SasRadius.xlAll,
        child: Container(
          constraints: const BoxConstraints(minHeight: 40),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: active ? accent.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: SasRadius.xlAll,
            border: Border.all(
              color: active
                  ? accent.withValues(alpha: 0.5)
                  : (isDark ? SasColors.darkBorder : SasColors.border),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 150),
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: color, fontSize: 12.5, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
