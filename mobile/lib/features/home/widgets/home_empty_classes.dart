import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';

/// Nothing to show for today. A student with no class at all is told so, because their
/// timetable stays empty until an admin adds them to one.
class HomeEmptyClasses extends StatelessWidget {
  final bool inAClass;

  const HomeEmptyClasses({super.key, required this.inAClass});

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SasColors.copper.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              inAClass
                  ? Icons.event_available_rounded
                  : Icons.groups_2_outlined,
              size: 26,
              color: SasColors.copper,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            inAClass
                ? 'No Classes Scheduled Today'
                : "You're not in a class yet",
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            inAClass
                ? 'Your timetable is clear for today. Live sessions will appear here as scheduled.'
                : 'Ask your institution admin to add you to your class. Your timetable appears here once you are in one.',
            style: const TextStyle(
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
