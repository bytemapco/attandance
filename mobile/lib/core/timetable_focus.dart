import 'package:smart_attendance_app/domain/models/timetable.dart';

typedef FocusedClass = ({TimetableEntry entry, bool isCurrent});

/// The class to highlight in a day: the one happening now (or open for attendance), else the next
/// one that has not started. Null when the day has nothing left. [entries] must be in time order.
FocusedClass? focusedClass(List<TimetableEntry> entries, DateTime clock) {
  for (final entry in entries) {
    final phase = entry.phaseAt(clock);
    if (phase == ClassPhase.openForAttendance || phase == ClassPhase.inProgress) {
      return (entry: entry, isCurrent: true);
    }
  }
  for (final entry in entries) {
    if (entry.phaseAt(clock) == ClassPhase.upcoming) {
      return (entry: entry, isCurrent: false);
    }
  }
  return null;
}
