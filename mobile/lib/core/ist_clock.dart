/// Class times from the server are Indian Standard Time wall-clock values ("09:00" on a date).
/// These helpers keep them and "now" in the same frame, whatever the phone's time zone is.
const Duration _istOffset = Duration(hours: 5, minutes: 30);

/// The current IST wall-clock time, as a UTC-flagged DateTime so it compares with [istWallTime].
/// Pass [clock] to test with a fixed moment.
DateTime istNow([DateTime? clock]) =>
    (clock ?? DateTime.now()).toUtc().add(_istOffset);

/// A date plus "HH:MM" from the server, as an IST wall-clock moment.
DateTime istWallTime(DateTime date, String hhmm) {
  final parts = hhmm.split(':');
  return DateTime.utc(
    date.year,
    date.month,
    date.day,
    int.parse(parts[0]),
    int.parse(parts[1]),
  );
}

/// "09:00" as "9:00 AM".
String formatClockTime(String hhmm) {
  final parts = hhmm.split(':');
  final hour = int.parse(parts[0]);
  final hour12 = hour % 12 == 0 ? 12 : hour % 12;
  return '$hour12:${parts[1]} ${hour < 12 ? 'AM' : 'PM'}';
}

/// The date part of an IST moment, with no time.
DateTime istDay(DateTime ist) => DateTime.utc(ist.year, ist.month, ist.day);

/// Parses the server's "YYYY-MM-DD" into a day (UTC-flagged, midnight).
DateTime parseServerDay(String raw) {
  final parts = raw.split('-');
  return DateTime.utc(
    int.parse(parts[0]),
    int.parse(parts[1]),
    int.parse(parts[2]),
  );
}

/// "YYYY-MM-DD" for a day, the form the server expects.
String formatServerDay(DateTime day) =>
    '${day.year.toString().padLeft(4, '0')}-'
    '${day.month.toString().padLeft(2, '0')}-'
    '${day.day.toString().padLeft(2, '0')}';

/// The Monday of the week that holds [day].
DateTime mondayOf(DateTime day) =>
    istDay(day).subtract(Duration(days: day.weekday - 1));
