import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/core/extensions.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/calendar_month_grid.dart';
import 'package:smart_attendance_app/features/history/widgets/history_session_tile.dart';
import 'package:smart_attendance_app/features/history/widgets/history_subject_breakdown.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/legend_dot.dart';
import 'package:smart_attendance_app/shared/widgets/stat_tile.dart';

class HistoryCalendarTab extends StatefulWidget {
  final HistoryState hState;
  const HistoryCalendarTab({super.key, required this.hState});

  @override
  State<HistoryCalendarTab> createState() => _HistoryCalendarTabState();
}

class _HistoryCalendarTabState extends State<HistoryCalendarTab> {
  DateTime _focusedMonth = DateTime.now();
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
  }

  @override
  Widget build(BuildContext context) {
    final grouped = widget.hState.groupedByDate;
    final history = widget.hState.data?.history ?? [];
    final monthItems = history.where((h) =>
        h.markedAt.year == _focusedMonth.year && h.markedAt.month == _focusedMonth.month).toList();

    final mPresent = countPresentOrApproved(monthItems);
    final mAbsent = countAbsent(monthItems);
    final mFlagged = countFlagged(monthItems);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (history.isNotEmpty) ...[
          HistorySubjectBreakdown(history: history),
          const SizedBox(height: 14),
        ],
        GlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            children: [
              _buildHeader(),
              const SizedBox(height: 10),
              _buildDayNames(),
              const SizedBox(height: 6),
              CalendarMonthGrid(
                focusedMonth: _focusedMonth,
                selectedDate: _selectedDate,
                grouped: grouped,
                onSelectDate: (d) => setState(() => _selectedDate = d),
              ),
              const SizedBox(height: 10),
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  LegendDot(color: SasColors.accentEmerald, label: 'Present'),
                  SizedBox(width: 12),
                  LegendDot(color: SasColors.warning, label: 'Flagged'),
                  SizedBox(width: 12),
                  LegendDot(color: SasColors.danger, label: 'Absent'),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: SasColors.bgCanvas,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    StatTile(label: 'Present', value: '$mPresent', color: SasColors.accentEmerald, variant: StatTileVariant.minimal),
                    StatTile(label: 'Absent', value: '$mAbsent', color: SasColors.danger, variant: StatTileVariant.minimal),
                    StatTile(label: 'Flagged', value: '$mFlagged', color: SasColors.warning, variant: StatTileVariant.minimal),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Text(
          _selectedDate.formattedDate,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: SasColors.textPrimary),
        ),
        const SizedBox(height: 6),
        ..._buildDayRecords(grouped[_selectedDate] ?? []),
      ],
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left_rounded, size: 20),
          color: SasColors.textSecondary,
          splashRadius: 18,
          onPressed: () => setState(() => _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1)),
        ),
        Text(
          DateFormat.yMMMM().format(_focusedMonth),
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: SasColors.textPrimary),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right_rounded, size: 20),
          color: SasColors.textSecondary,
          splashRadius: 18,
          onPressed: () => setState(() => _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1)),
        ),
      ],
    );
  }

  Widget _buildDayNames() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Row(
      children: days.map((d) => Expanded(
        child: Center(
          child: Text(
            d,
            style: const TextStyle(color: SasColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600),
          ),
        ),
      )).toList(),
    );
  }

  List<Widget> _buildDayRecords(List<AttendanceHistoryItem> items) {
    if (items.isEmpty) {
      return [
        const GlassCard(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text('No attendance records for this date.', style: TextStyle(color: SasColors.textMuted, fontSize: 12)),
          ),
        ),
      ];
    }
    return items.map((item) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: HistorySessionTile(item: item),
    )).toList();
  }
}
