import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class HomeEmptyClasses extends StatelessWidget {
  const HomeEmptyClasses({super.key});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SasColors.osageOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.event_available_rounded,
              size: 26,
              color: SasColors.osageOrange,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'No Classes Scheduled Today',
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 15,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Your timetable is clear for today. Live sessions will appear here as scheduled.',
            style: TextStyle(
              color: SasColors.textMuted,
              fontSize: 12,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
