import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/history_calendar_tab.dart';
import 'package:smart_attendance_app/features/history/widgets/history_list_tab.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

enum HistoryViewMode { calendar, list }

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  HistoryViewMode _mode = HistoryViewMode.calendar;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) ref.read(historyProvider.notifier).fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final hState = ref.watch(historyProvider);
    final pct = hState.data?.overallAttendancePercentage ?? 0;

    return AnimatedBackground(
      child: SafeArea(
        child: RefreshIndicator(
          color: SasColors.accentEmerald,
          backgroundColor: SasColors.bgSecondary,
          onRefresh: () => ref.read(historyProvider.notifier).fetch(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GlassCard(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: pctColor(pct).withValues(alpha: 0.1),
                      ),
                      child: Center(
                        child: Text(
                          '${pct.toStringAsFixed(0)}%',
                          style: TextStyle(color: pctColor(pct), fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Attendance Log', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: SasColors.textPrimary)),
                          Text('Historical record across all courses', style: TextStyle(color: SasColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: SasColors.bgSecondary,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: SasColors.glassBorder),
                ),
                child: Row(
                  children: [
                    _buildTabBtn('Calendar', Icons.calendar_month_rounded, _mode == HistoryViewMode.calendar, () {
                      setState(() => _mode = HistoryViewMode.calendar);
                    }),
                    _buildTabBtn('List View', Icons.format_list_bulleted_rounded, _mode == HistoryViewMode.list, () {
                      setState(() => _mode = HistoryViewMode.list);
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (hState.errorMessage != null && hState.data == null)
                GlassCard(
                  borderColor: SasColors.danger.withValues(alpha: 0.3),
                  child: Column(
                    children: [
                      const Icon(Icons.cloud_off_rounded, size: 36, color: SasColors.danger),
                      const SizedBox(height: 10),
                      Text(hState.errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: SasColors.textSecondary, fontSize: 13)),
                      const SizedBox(height: 12),
                      GlassButton(
                        label: 'Retry Connection',
                        icon: Icons.refresh_rounded,
                        onPressed: () => ref.read(historyProvider.notifier).fetch(),
                      ),
                    ],
                  ),
                )
              else if (hState.isLoading && hState.data == null)
                const ShimmerCalendarPlaceholder()
              else if (_mode == HistoryViewMode.calendar)
                HistoryCalendarTab(hState: hState)
              else
                HistoryListTab(hState: hState),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabBtn(String label, IconData icon, bool selected, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? SasColors.accentEmerald.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 15, color: selected ? SasColors.accentEmerald : SasColors.textMuted),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? SasColors.accentEmerald : SasColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
