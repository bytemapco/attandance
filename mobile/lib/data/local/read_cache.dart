import 'dart:convert';

import 'package:hive/hive.dart';

class CachedJson {
  final Map<String, dynamic> data;
  final DateTime savedAt;

  const CachedJson(this.data, this.savedAt);
}

/// The last good server answer for read-only screens, so they still open without a connection.
/// Each entry remembers when it was saved, so the screen can say how old it is.
class ReadCache {
  final Box<String>? _box;

  const ReadCache(this._box);

  Future<void> put(String key, Map<String, dynamic> data) async {
    final entry = {'saved_at': DateTime.now().toIso8601String(), 'data': data};
    await _box?.put(key, jsonEncode(entry));
  }

  CachedJson? get(String key) {
    final raw = _box?.get(key);
    if (raw == null) return null;
    try {
      final entry = jsonDecode(raw) as Map<String, dynamic>;
      return CachedJson(
        entry['data'] as Map<String, dynamic>,
        DateTime.parse(entry['saved_at'] as String),
      );
    } on FormatException {
      return null;
    }
  }

  Future<void> clear() async => _box?.clear();
}
