import 'package:intl/intl.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

class WeeklyChartData {
  final List<String> weeks;
  final List<double> presentCounts;
  final List<double> scheduledCounts;

  const WeeklyChartData({
    required this.weeks,
    required this.presentCounts,
    required this.scheduledCounts,
  });

  factory WeeklyChartData.fromHistory(AttendanceHistoryResponse data) {
    final weeks = ['Oct 5', 'Oct 12', 'Oct 19', 'Oct 26'];
    final presentCounts = [0.0, 0.0, 0.0, 1.0];
    final scheduledCounts = [2.0, 2.0, 2.0, 5.0];

    if (data.history.isNotEmpty) {
      final now = DateTime.now();
      for (int i = 0; i < 4; i++) {
        final w = 3 - i;
        final weekStart = now.subtract(Duration(days: now.weekday - 1 + w * 7));
        final weekEnd = weekStart.add(const Duration(days: 6));
        final label = DateFormat('MMM d').format(weekStart);
        weeks[i] = label;

        final weekItems = data.history.where((h) {
          return h.markedAt.isAfter(
                weekStart.subtract(const Duration(days: 1)),
              ) &&
              h.markedAt.isBefore(weekEnd.add(const Duration(days: 1)));
        }).toList();

        final p = countPresentOrApproved(weekItems).toDouble();
        final s = weekItems.length.toDouble();
        if (s > 0) {
          presentCounts[i] = p;
          scheduledCounts[i] = s;
        }
      }
    }

    return WeeklyChartData(
      weeks: weeks,
      presentCounts: presentCounts,
      scheduledCounts: scheduledCounts,
    );
  }
}
