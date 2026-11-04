import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

/// Keeps decorative slop from coming back. Each rule lists the files that are
/// allowed to use the construct because it does real work.
void main() {
  final lib = Directory('lib');
  final files = lib
      .listSync(recursive: true)
      .whereType<File>()
      .where((f) => f.path.endsWith('.dart'))
      .toList();

  String rel(File f) => f.path.replaceFirst('lib/', '');

  List<String> offenders(RegExp pattern, {Set<String> allowed = const {}}) {
    return [
      for (final f in files)
        if (!allowed.contains(rel(f)) && pattern.hasMatch(f.readAsStringSync())) rel(f),
    ];
  }

  test('no box shadows', () {
    expect(offenders(RegExp(r'BoxShadow\(')), isEmpty);
  });

  test('no backdrop blur', () {
    expect(offenders(RegExp(r'BackdropFilter|ImageFilter\.blur')), isEmpty);
  });

  test('gradients only where they do a job (laser line, radar sweep, image fade)', () {
    expect(
      offenders(
        RegExp(r'(Linear|Radial|Sweep)Gradient\('),
        allowed: {
          'features/smart_pass/widgets/scanner_reticle_overlay.dart',
          'features/attendance/widgets/geofence_radar_indicator.dart',
          'features/home/screens/home_screen.dart',
        },
      ),
      isEmpty,
    );
  });

  test('no emoji in source strings', () {
    final emoji = RegExp(r'[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]', unicode: true);
    expect(offenders(emoji), isEmpty);
  });

  test('no text below 11px', () {
    final tiny = RegExp(r'fontSize: (?:[0-9]|10)(?:\.[0-9]+)?,');
    expect(offenders(tiny), isEmpty);
  });

  test('no hardcoded orange brand color', () {
    final orange = RegExp(r'0xFFF95721|0xFFFF7A18|0xFFF97316|0xFFEA580C');
    expect(offenders(orange, allowed: {'app/theme.dart'}), isEmpty);
  });
}
