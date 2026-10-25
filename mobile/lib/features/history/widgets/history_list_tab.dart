import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/history_session_tile.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/stat_tile.dart';
import 'package:smart_attendance_app/shared/widgets/status_chip.dart';

enum ListStatusFilter { all, present, absent, flagged }

class HistoryListTab extends StatefulWidget {
  final HistoryState hState;
  const HistoryListTab({super.key, required this.hState});

  @override
  State<HistoryListTab> createState() => _HistoryListTabState();
}

class _HistoryListTabState extends State<HistoryListTab> {
  ListStatusFilter _filter = ListStatusFilter.all;
  String? _subjectFilter;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final all = widget.hState.data?.history ?? [];
    final subjects = all.map((h) => h.subject).toSet().toList()..sort();

    var filtered = all.where((h) {
      if (_filter == ListStatusFilter.present) {
        return h.status == 'Present' || h.status == 'Approved';
      }
      if (_filter == ListStatusFilter.absent) return h.status == 'Absent';
      if (_filter == ListStatusFilter.flagged) return h.status == 'Flagged';
      return true;
    }).toList();

    if (_subjectFilter != null) {
      filtered = filtered.where((h) => h.subject == _subjectFilter).toList();
    }
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where((h) =>
              h.subject.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              h.className.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }
    filtered.sort((a, b) => b.markedAt.compareTo(a.markedAt));

    final total = all.length;
    final present = countPresentOrApproved(all);
    final absent = countAbsent(all);
    final flagged = countFlagged(all);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: StatTile(
                label: 'Total',
                value: '$total',
                color: SasColors.info,
                variant: StatTileVariant.pill,
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: StatTile(
                label: 'Present',
                value: '$present',
                color: SasColors.success,
                variant: StatTileVariant.pill,
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: StatTile(
                label: 'Absent',
                value: '$absent',
                color: SasColors.danger,
                variant: StatTileVariant.pill,
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: StatTile(
                label: 'Flagged',
                value: '$flagged',
                color: SasColors.warning,
                variant: StatTileVariant.pill,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _searchController,
          onChanged: (v) => setState(() => _searchQuery = v),
          style: const TextStyle(color: SasColors.textPrimary, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Search course name or code…',
            hintStyle:
                const TextStyle(color: SasColors.textMuted, fontSize: 13),
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: SasColors.textMuted,
              size: 18,
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded,
                        color: SasColors.textMuted, size: 16),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
          ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              ...ListStatusFilter.values.map((f) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: StatusChip(
                      label: f.name[0].toUpperCase() + f.name.substring(1),
                      color: SasColors.accentEmerald,
                      isSelected: _filter == f,
                      onTap: () => setState(() => _filter = f),
                      variant: StatusChipVariant.outlined,
                    ),
                  )),
              if (subjects.isNotEmpty) ...[
                const SizedBox(width: 4),
                const Text('|',
                    style: TextStyle(color: SasColors.glassBorder)),
                const SizedBox(width: 4),
                ...subjects.map((s) => Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: StatusChip(
                        label: s.length > 14 ? '${s.substring(0, 14)}…' : s,
                        color: SasColors.accentTeal,
                        isSelected: _subjectFilter == s,
                        onTap: () => setState(() =>
                            _subjectFilter = _subjectFilter == s ? null : s),
                        variant: StatusChipVariant.outlined,
                      ),
                    )),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (filtered.isEmpty)
          GlassCard(
            padding: const EdgeInsets.all(24),
            child: const Center(
              child: Text(
                'No attendance records found matching filters.',
                style: TextStyle(color: SasColors.textMuted, fontSize: 13),
              ),
            ),
          )
        else
          ...filtered.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: HistorySessionTile(item: item),
              )),
      ],
    );
  }
}
