import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/local/preferences_service.dart';

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final PreferencesService _prefs;

  ThemeModeNotifier(this._prefs) : super(ThemeMode.light) {
    _load();
  }

  Future<void> _load() async {
    final modeStr = await _prefs.getThemeMode();
    switch (modeStr) {
      case 'dark':
        state = ThemeMode.dark;
        break;
      case 'system':
        state = ThemeMode.system;
        break;
      case 'light':
      default:
        state = ThemeMode.light;
        break;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    String value = 'light';
    if (mode == ThemeMode.dark) value = 'dark';
    if (mode == ThemeMode.system) value = 'system';
    await _prefs.setThemeMode(value);
  }
}

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final prefs = ref.watch(preferencesServiceProvider);
  return ThemeModeNotifier(prefs);
});
