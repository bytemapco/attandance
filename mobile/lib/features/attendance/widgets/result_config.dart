import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

class ScoreData {
  final double overall;
  final double face;
  final double liveness;
  final double background;

  const ScoreData({
    required this.overall,
    required this.face,
    required this.liveness,
    required this.background,
  });
}

class ResultConfig {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final ScoreData? scores;

  const ResultConfig({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.scores,
  });

  factory ResultConfig.error(String? message) => ResultConfig(
    icon: Icons.error_outline_rounded,
    color: SasColors.danger,
    title: 'Submission Failed',
    subtitle: message ?? 'Could not submit attendance. Please try again.',
  );

  factory ResultConfig.offline() => const ResultConfig(
    icon: Icons.cloud_done_rounded,
    color: SasColors.info,
    title: 'Saved Offline',
    subtitle:
        'Attendance queued locally. It will automatically sync when online.',
  );

  factory ResultConfig.present(AttendanceResult att) => ResultConfig(
    icon: Icons.check_circle_rounded,
    color: SasColors.accentEmerald,
    title: 'Verified Present',
    subtitle: 'Attendance confirmed for this class session.',
    scores: ScoreData(
      overall: att.finalAiScore,
      face: att.faceScore,
      liveness: att.livenessScore,
      background: att.backgroundScore,
    ),
  );

  factory ResultConfig.flagged(AttendanceResult att) => ResultConfig(
    icon: Icons.schedule_rounded,
    color: const Color(0xFFF95721),
    title: 'Sent for Review',
    subtitle: 'Attendance recorded. Pending instructor review.',
    scores: ScoreData(
      overall: att.finalAiScore,
      face: att.faceScore,
      liveness: att.livenessScore,
      background: att.backgroundScore,
    ),
  );

  factory ResultConfig.processing() => const ResultConfig(
    icon: Icons.hourglass_top_rounded,
    color: SasColors.textMuted,
    title: 'Checking Attendance',
    subtitle: 'Verifying location and biometric records...',
  );
}
