import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/history_grouping.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/history_entry_tile.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';
import 'package:smart_attendance_app/shared/widgets/empty_state.dart';
import 'package:smart_attendance_app/shared/widgets/info_banner.dart';
import 'package:smart_attendance_app/shared/widgets/saved_data_notice.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

/// The classes in [state], grouped by day, with every loading, empty, error and offline state.
class HistoryList extends StatelessWidget {
  final HistoryState state;
  final VoidCallback onRetry;
  final VoidCallback onLoadMore;
  final ValueChanged<HistoryEntry> onOpen;

  const HistoryList({
    super.key,
    required this.state,
    required this.onRetry,
    required this.onLoadMore,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    if (state.isInitialLoading) {
      return const ShimmerPlaceholder(itemCount: 5, itemHeight: 64);
    }
    if (state.isBlockingError) {
      return InfoBanner(
        severity: BannerSeverity.danger,
        message: state.errorMessage!,
        actionLabel: 'Retry',
        onAction: onRetry,
      );
    }
    if (state.isEmpty) {
      return EmptyState(
        icon: Icons.history_rounded,
        title: state.filter.isEmpty ? 'No classes yet' : 'Nothing matches',
        message: state.filter.isEmpty
            ? 'Classes appear here once your teacher has taken attendance.'
            : 'Try a wider date range or clear a filter.',
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (state.cachedAt != null) ...[
          SavedDataNotice(savedAt: state.cachedAt!),
          const SizedBox(height: 12),
        ],
        if (state.errorMessage != null) ...[
          InlineInfoBanner(message: 'Could not refresh. ${state.errorMessage}'),
          const SizedBox(height: 12),
        ],
        for (final day in groupByDay(state.items)) ...[
          _DayHeader(day: day),
          for (final entry in day.entries) ...[
            HistoryEntryTile(entry: entry, onTap: () => onOpen(entry)),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 8),
        ],
        if (state.moreErrorMessage != null)
          InlineInfoBanner(message: state.moreErrorMessage!),
        if (state.hasMore)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: AppButton(
              label: 'Show more (${state.total - state.items.length} left)',
              variant: AppButtonVariant.secondary,
              isExpanded: true,
              isLoading: state.isLoadingMore,
              onPressed: onLoadMore,
            ),
          ),
      ],
    );
  }
}

class _DayHeader extends StatelessWidget {
  final HistoryDay day;
  const _DayHeader({required this.day});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              DateFormat('EEE, d MMM yyyy').format(day.date),
              style: TextStyle(
                color: SasColors.textPrimaryOf(context),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            day.summary,
            style: TextStyle(color: SasColors.textMutedOf(context), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
