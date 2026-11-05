import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';

Color outcomeColor(AttendanceOutcome outcome) => switch (outcome) {
  AttendanceOutcome.present || AttendanceOutcome.approved => SasColors.success,
  AttendanceOutcome.excused => SasColors.info,
  AttendanceOutcome.late => SasColors.warning,
  AttendanceOutcome.flagged => SasColors.copperStrong,
  AttendanceOutcome.absent => SasColors.danger,
};

IconData outcomeIcon(AttendanceOutcome outcome) => switch (outcome) {
  AttendanceOutcome.present ||
  AttendanceOutcome.approved => Icons.check_circle_rounded,
  AttendanceOutcome.excused => Icons.event_available_rounded,
  AttendanceOutcome.late => Icons.schedule_rounded,
  AttendanceOutcome.flagged => Icons.hourglass_top_rounded,
  AttendanceOutcome.absent => Icons.cancel_rounded,
};

Color standingColor(Standing standing) => switch (standing) {
  Standing.ok => SasColors.success,
  Standing.atRisk => SasColors.warning,
  Standing.shortage => SasColors.danger,
  Standing.noData => SasColors.textMuted,
};

String standingLabel(Standing standing) => switch (standing) {
  Standing.ok => 'On track',
  Standing.atRisk => 'At risk',
  Standing.shortage => 'Shortage',
  Standing.noData => 'No classes yet',
};

/// "82%" or "–" when no class has been held yet. Never a made-up 0%.
String percentLabel(double? percentage) {
  if (percentage == null) return '–';
  final whole = percentage == percentage.roundToDouble();
  return '${percentage.toStringAsFixed(whole ? 0 : 1)}%';
}
