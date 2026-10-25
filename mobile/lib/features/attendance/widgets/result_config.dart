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
        subtitle: message ?? 'Something went wrong. Please try again.',
      );

  factory ResultConfig.offline() => const ResultConfig(
        icon: Icons.cloud_sync_rounded,
        color: SasColors.info,
        title: 'Saved Offline',
        subtitle: 'Attendance queued. It will sync once internet is connected.',
      );

  factory ResultConfig.present(AttendanceResult att) => ResultConfig(
        icon: Icons.check_circle_rounded,
        color: SasColors.accentEmerald,
        title: 'Verified Present',
        subtitle: 'Your attendance has been confirmed and logged.',
        scores: ScoreData(
          overall: att.finalAiScore,
          face: att.faceScore,
          liveness: att.livenessScore,
          background: att.backgroundScore,
        ),
      );

  factory ResultConfig.flagged(AttendanceResult att) => ResultConfig(
        icon: Icons.warning_amber_rounded,
        color: SasColors.warning,
        title: 'Sent for Review',
        subtitle: 'Submitted for teacher review.',
        scores: ScoreData(
          overall: att.finalAiScore,
          face: att.faceScore,
          liveness: att.livenessScore,
          background: att.backgroundScore,
        ),
      );

  factory ResultConfig.processing() => const ResultConfig(
        icon: Icons.hourglass_empty_rounded,
        color: SasColors.textMuted,
        title: 'Verifying Attendance...',
        subtitle: 'Checking face and location',
      );
}
