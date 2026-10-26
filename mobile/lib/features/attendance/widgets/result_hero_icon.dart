import 'package:flutter/material.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';

class ResultHeroIcon extends StatelessWidget {
  final ResultConfig config;

  const ResultHeroIcon({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: config.color.withValues(alpha: 0.1),
        border: Border.all(
          color: config.color.withValues(alpha: 0.35),
          width: 2,
        ),
      ),
      child: Center(
        child: Icon(
          config.icon,
          size: 42,
          color: config.color,
        ),
      ),
    );
  }
}
