import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class LeavePeriodPicker extends StatelessWidget {
  final DateTime? startDate;
  final DateTime? endDate;
  final VoidCallback onSelectStart;
  final VoidCallback onSelectEnd;

  const LeavePeriodPicker({
    super.key,
    required this.startDate,
    required this.endDate,
    required this.onSelectStart,
    required this.onSelectEnd,
  });

  @override
  Widget build(BuildContext context) {
    final dayCount = startDate != null && endDate != null
        ? endDate!.difference(startDate!).inDays + 1
        : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Leave Duration',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: GlassCard(
                onTap: onSelectStart,
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.calendar_today_rounded,
                            size: 13, color: SasColors.textMuted),
                        SizedBox(width: 5),
                        Text(
                          'Start Date',
                          style: TextStyle(
                            color: SasColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      startDate != null
                          ? DateFormat('MMM d, yyyy').format(startDate!)
                          : 'Select date',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: startDate != null
                            ? SasColors.textPrimary
                            : SasColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: GlassCard(
                onTap: onSelectEnd,
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.event_rounded,
                            size: 13, color: SasColors.textMuted),
                        SizedBox(width: 5),
                        Text(
                          'End Date',
                          style: TextStyle(
                            color: SasColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      endDate != null
                          ? DateFormat('MMM d, yyyy').format(endDate!)
                          : 'Select date',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: endDate != null
                            ? SasColors.textPrimary
                            : SasColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (dayCount > 0) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: SasColors.info.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: SasColors.info.withValues(alpha: 0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.info_outline_rounded,
                    size: 13, color: SasColors.info),
                const SizedBox(width: 6),
                Text(
                  '$dayCount ${dayCount == 1 ? 'day' : 'days'} total duration',
                  style: const TextStyle(
                    color: SasColors.info,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
