import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/history_card_item.dart';
import 'package:smart_attendance_app/features/history/widgets/history_filter_pill.dart';

enum HistoryStatusFilter { all, present, absent, excused }

/// List View tab with filter pills and date-badged attendance log cards.
class HistoryListTab extends StatefulWidget {
  final HistoryState hState;

  const HistoryListTab({super.key, required this.hState});

  @override
  State<HistoryListTab> createState() => _HistoryListTabState();
}

class _HistoryListTabState extends State<HistoryListTab> {
  HistoryStatusFilter _filter = HistoryStatusFilter.all;

  @override
  Widget build(BuildContext context) {
    final history = widget.hState.data?.history ?? [];
    final items = _buildFilteredList(history);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Filter pills row
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              HistoryFilterPill(
                label: 'All',
                value: HistoryStatusFilter.all,
                current: _filter,
                onTap: () => setState(() => _filter = HistoryStatusFilter.all),
              ),
              const SizedBox(width: 8),
              HistoryFilterPill(
                label: 'Present',
                value: HistoryStatusFilter.present,
                current: _filter,
                unselectedBgColor: const Color(0xFFE8F8F0),
                unselectedTextColor: const Color(0xFF10B981),
                onTap: () =>
                    setState(() => _filter = HistoryStatusFilter.present),
              ),
              const SizedBox(width: 8),
              HistoryFilterPill(
                label: 'Absent',
                value: HistoryStatusFilter.absent,
                current: _filter,
                unselectedBgColor: const Color(0xFFFEE8E8),
                unselectedTextColor: const Color(0xFFEF4444),
                onTap: () =>
                    setState(() => _filter = HistoryStatusFilter.absent),
              ),
              const SizedBox(width: 8),
              HistoryFilterPill(
                label: 'Excused',
                value: HistoryStatusFilter.excused,
                current: _filter,
                unselectedBgColor: const Color(0xFFFEF3C7),
                unselectedTextColor: const Color(0xFFF59E0B),
                onTap: () =>
                    setState(() => _filter = HistoryStatusFilter.excused),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // List of attendance cards
        ...items,
      ],
    );
  }

  List<Widget> _buildFilteredList(List<AttendanceHistoryItem> history) {
    if (history.isEmpty) {
      return [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 36),
          child: Center(
            child: Text(
              'No attendance records found.',
              style: TextStyle(
                color: SasColors.textMutedOf(context),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ];
    }

    final filtered = history.where((h) {
      final s = h.status.toLowerCase();
      switch (_filter) {
        case HistoryStatusFilter.all:
          return true;
        case HistoryStatusFilter.present:
          return s == 'present' || s == 'approved';
        case HistoryStatusFilter.absent:
          return s == 'absent';
        case HistoryStatusFilter.excused:
          return s == 'excused' || s == 'flagged';
      }
    }).toList();

    if (filtered.isEmpty) {
      return [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 36),
          child: Center(
            child: Text(
              'No attendance logs found for this filter.',
              style: TextStyle(
                color: SasColors.textMutedOf(context),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ];
    }

    return filtered.map((item) {
      final code = _extractCode(item.className);
      return HistoryCardItem(
        monthText: DateFormat('MMM').format(item.markedAt),
        dayText: '${item.markedAt.day}',
        courseTitle: item.subject,
        subtitle: code.isNotEmpty ? '$code • Session Log' : 'Session Log',
        timeText: DateFormat('h:mm a').format(item.markedAt),
        status: item.status,
      );
    }).toList();
  }

  String _extractCode(String name) {
    if (name.contains(':')) return name.split(':').first.trim();
    return name;
  }
}
