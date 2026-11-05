/// What a class came to for a student. One mapping of the server's status names, used everywhere.
enum AttendanceOutcome {
  present('PRESENT', 'Present'),
  late('LATE', 'Late'),
  approved('APPROVED', 'Approved'),
  excused('EXCUSED', 'Excused'),
  flagged('FLAGGED', 'Pending review'),
  absent('ABSENT', 'Absent');

  final String wire;
  final String label;
  const AttendanceOutcome(this.wire, this.label);

  /// Counts toward the attendance percentage. A flagged mark does not until a teacher approves it.
  bool get countsAsAttended => switch (this) {
    present || late || approved || excused => true,
    flagged || absent => false,
  };

  /// Parses the server's status name. Throws on a name this app does not know rather than guessing.
  static AttendanceOutcome parse(String raw) {
    final name = raw.trim().toUpperCase();
    for (final outcome in values) {
      if (outcome.wire == name) return outcome;
    }
    throw FormatException('Unknown attendance status', raw);
  }

  static AttendanceOutcome? tryParse(String? raw) =>
      raw == null ? null : parse(raw);
}
