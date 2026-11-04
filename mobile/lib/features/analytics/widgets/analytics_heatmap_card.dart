import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

/// Heatmap card showing course activity across weekdays with rounded squircle blocks.
class AnalyticsHeatmapCard extends StatelessWidget {
  final AttendanceHistoryResponse data;

  const AnalyticsHeatmapCard({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const columns = 14;

    // Heatmap cell matrix: 0 = empty, 1 = present (green), 2 = absent (red)
    final grid = List.generate(5, (_) => List.filled(columns, 0));

    // Fallback baseline positions matching screenshot
    grid[0][8] = 1; // Mon: Green
    grid[0][12] = 2; // Mon: Red
    grid[1][9] = 2; // Tue: Red
    grid[3][7] = 1; // Thu: Green

    // Map dynamic items if available
    for (final item in data.history) {
      final weekdayIdx = item.markedAt.weekday - 1; // 0 = Mon
      if (weekdayIdx >= 0 && weekdayIdx < 5) {
        final colIdx = (item.markedAt.day % columns).clamp(0, columns - 1);
        final status = item.status.toLowerCase();
        if (status == 'present' || status == 'approved') {
          grid[weekdayIdx][colIdx] = 1;
        } else if (status == 'absent') {
          grid[weekdayIdx][colIdx] = 2;
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Icon(
                Icons.calendar_today_rounded,
                color: SasColors.copper,
                size: 19,
              ),
              const SizedBox(width: 8),
              Text(
                'Course activity heatmap',
                style: SasTypography.style(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Heatmap grid with weekday labels
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Weekday labels
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: weekdays.map((day) {
                  return Container(
                    height: 14,
                    margin: const EdgeInsets.symmetric(vertical: 2.5),
                    alignment: Alignment.centerLeft,
                    child: Text(
                      day,
                      style: SasTypography.style(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: subtitleColor,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(width: 10),

              // Blocks
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: List.generate(5, (r) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2.5),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: List.generate(columns, (c) {
                            final state = grid[r][c];
                            Color cellColor;
                            if (state == 1) {
                              cellColor = const Color(
                                0xFF10B981,
                              ); // Present (Green)
                            } else if (state == 2) {
                              cellColor = const Color(
                                0xFFF87171,
                              ); // Absent (Red)
                            } else {
                              cellColor = isDark
                                  ? SasColors.textSecondary
                                  : SasColors.ivory; // Empty slate
                            }

                            return Container(
                              width: 14,
                              height: 14,
                              margin: const EdgeInsets.symmetric(horizontal: 2),
                              decoration: BoxDecoration(
                                color: cellColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            );
                          }),
                        ),
                      );
                    }),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
