import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/local/preferences_service.dart';

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final PreferencesService _prefs;

  ThemeModeNotifier(this._prefs) : super(ThemeMode.system) {
    _load();
  }

  Future<void> _load() async {
    final modeStr = await _prefs.getThemeMode();
    switch (modeStr) {
      case 'dark':
        state = ThemeMode.dark;
        break;
      case 'light':
        state = ThemeMode.light;
        break;
      case 'system':
      default:
        state = ThemeMode.system;
        break;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    String value = 'dark';
    if (mode == ThemeMode.light) value = 'light';
    if (mode == ThemeMode.system) value = 'system';
    await _prefs.setThemeMode(value);
  }
}

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final prefs = ref.watch(preferencesServiceProvider);
  return ThemeModeNotifier(prefs);
});
