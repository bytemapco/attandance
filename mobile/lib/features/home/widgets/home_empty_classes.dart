import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class HomeEmptyClasses extends StatelessWidget {
  const HomeEmptyClasses({super.key});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SasColors.bgSurface,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.calendar_today_rounded,
              size: 28,
              color: SasColors.textMuted,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'No scheduled classes today',
            style: TextStyle(
              color: SasColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Check back when timetable updates are published.',
            style: TextStyle(color: SasColors.textMuted, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
