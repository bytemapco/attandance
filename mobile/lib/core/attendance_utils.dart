import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';

bool isPresentOrApproved(String status) {
  final s = status.trim().toUpperCase();
  return s == 'PRESENT' || s == 'APPROVED';
}

Color scoreColor(double score) {
  if (score >= kGoodScoreThreshold) return SasColors.success;
  if (score >= kWarningScoreThreshold) return SasColors.warning;
  return SasColors.danger;
}

Color statusColor(String status) {
  final s = status.trim().toUpperCase();
  if (s == 'PRESENT' || s == 'APPROVED') {
    return SasColors.success;
  }
  if (s == 'FLAGGED') return SasColors.warning;
  return SasColors.danger;
}
