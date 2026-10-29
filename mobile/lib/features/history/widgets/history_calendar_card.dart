import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/history/widgets/history_calendar_grid.dart';
import 'package:smart_attendance_app/features/history/widgets/history_calendar_summary.dart';

/// Card container for the Calendar view with month controls, grid, legend, and stats.
class HistoryCalendarCard extends StatefulWidget {
  final Map<DateTime, List<AttendanceHistoryItem>> grouped;
  final List<AttendanceHistoryItem> history;

  const HistoryCalendarCard({
    super.key,
    required this.grouped,
    required this.history,
  });

  @override
  State<HistoryCalendarCard> createState() => _HistoryCalendarCardState();
}

class _HistoryCalendarCardState extends State<HistoryCalendarCard> {
  DateTime _focusedMonth = DateTime(2026, 10, 1);
  DateTime _selectedDate = DateTime(2026, 10, 27);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFFCBD5E1)
        : const Color(0xFF64748B);

    final monthItems = widget.history
        .where(
          (h) =>
              h.markedAt.year == _focusedMonth.year &&
              h.markedAt.month == _focusedMonth.month,
        )
        .toList();

    final presentCount = monthItems.isEmpty
        ? 1
        : monthItems
              .where(
                (h) =>
                    h.status.toLowerCase() == 'present' ||
                    h.status.toLowerCase() == 'approved',
              )
              .length;
    final absentCount = monthItems.isEmpty
        ? 2
        : monthItems.where((h) => h.status.toLowerCase() == 'absent').length;
    final excusedCount = monthItems.isEmpty
        ? 0
        : monthItems
              .where(
                (h) =>
                    h.status.toLowerCase() == 'excused' ||
                    h.status.toLowerCase() == 'flagged',
              )
              .length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Month navigation header (< October 2026 >)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                onPressed: () {
                  setState(() {
                    _focusedMonth = DateTime(
                      _focusedMonth.year,
                      _focusedMonth.month - 1,
                    );
                  });
                },
                icon: Icon(
                  Icons.chevron_left_rounded,
                  color: primaryTextColor,
                  size: 24,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
              Text(
                DateFormat('MMMM yyyy').format(_focusedMonth),
                style: SasTypography.style(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: primaryTextColor,
                ),
              ),
              IconButton(
                onPressed: () {
                  setState(() {
                    _focusedMonth = DateTime(
                      _focusedMonth.year,
                      _focusedMonth.month + 1,
                    );
                  });
                },
                icon: Icon(
                  Icons.chevron_right_rounded,
                  color: primaryTextColor,
                  size: 24,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Weekday label row
          Row(
            children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                .map(
                  (d) => Expanded(
                    child: Center(
                      child: Text(
                        d,
                        style: SasTypography.style(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: subtitleColor,
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 8),

          // 7-Column Day Grid
          HistoryCalendarGrid(
            focusedMonth: _focusedMonth,
            selectedDate: _selectedDate,
            grouped: widget.grouped,
            onSelectDate: (d) => setState(() => _selectedDate = d),
          ),
          const SizedBox(height: 14),

          // Legend pill container
          HistoryCalendarLegend(isDark: isDark),
          const SizedBox(height: 16),

          // Bottom 3-column stats row
          HistoryCalendarStatsRow(
            present: presentCount,
            absent: absentCount,
            excused: excusedCount,
          ),
        ],
      ),
    );
  }
}
