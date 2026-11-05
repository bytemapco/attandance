import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/history.dart';

class HistoryDay {
  final DateTime date;
  final List<HistoryEntry> entries;

  const HistoryDay(this.date, this.entries);

  int get absences =>
      entries.where((e) => e.outcome == AttendanceOutcome.absent).length;

  /// "3 classes" or "3 classes · 1 absent".
  String get summary {
    final classes = '${entries.length} ${entries.length == 1 ? 'class' : 'classes'}';
    return absences == 0 ? classes : '$classes · $absences absent';
  }
}

/// Groups entries by class date, keeping the order they arrive in (newest first).
List<HistoryDay> groupByDay(Iterable<HistoryEntry> entries) {
  final days = <HistoryDay>[];
  for (final entry in entries) {
    if (days.isNotEmpty && days.last.date == entry.date) {
      days.last.entries.add(entry);
    } else {
      days.add(HistoryDay(entry.date, [entry]));
    }
  }
  return days;
}
