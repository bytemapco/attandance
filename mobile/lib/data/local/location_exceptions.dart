class LocationException implements Exception {
  final String message;
  const LocationException(this.message);

  @override
  String toString() => message;
}
