/// Parses a timestamp from the backend and returns it in the device's local time zone.
/// The backend sends UTC. A value with no offset (for example "2026-11-01T12:03:24") is UTC too.
DateTime? parseServerTime(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  final hasOffset = RegExp(r'(Z|[+-]\d{2}:?\d{2})$').hasMatch(raw);
  return DateTime.tryParse(hasOffset ? raw : '${raw}Z')?.toLocal();
}
