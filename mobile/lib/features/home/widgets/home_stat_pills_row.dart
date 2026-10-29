import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Two compact summary stat cards (Streak & Classes this week) matching reference design.
class HomeStatPillsRow extends StatelessWidget {
  final int streakDays;
  final int classesThisWeek;
  final VoidCallback onTapStreak;
  final VoidCallback onTapClasses;

  const HomeStatPillsRow({
    super.key,
    required this.streakDays,
    required this.classesThisWeek,
    required this.onTapStreak,
    required this.onTapClasses,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatPillCard(
            icon: Icons.local_fire_department_rounded,
            iconColor: const Color(0xFFF95721),
            iconBg: const Color(0xFFFFEDD5),
            title: '$streakDays ${streakDays == 1 ? "Day" : "Days"}',
            subtitle: 'Streak',
            onTap: onTapStreak,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatPillCard(
            icon: Icons.school_rounded,
            iconColor: const Color(0xFF2563EB),
            iconBg: const Color(0xFFDBEAFE),
            title:
                '$classesThisWeek ${classesThisWeek == 1 ? "Class" : "Classes"}',
            subtitle: 'This Week',
            onTap: onTapClasses,
          ),
        ),
      ],
    );
  }
}

class _StatPillCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _StatPillCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFFE2E8F0)
        : const Color(0xFF475569);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0x0F000000),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            // Circular Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
              child: Center(child: Icon(icon, color: iconColor, size: 22)),
            ),
            const SizedBox(width: 10),

            // Text info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: SasTypography.style(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: primaryTextColor,
                      letterSpacing: -0.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: SasTypography.style(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: subtitleColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Subtle Chevron matching goal UI
            Icon(Icons.chevron_right_rounded, size: 20, color: subtitleColor),
          ],
        ),
      ),
    );
  }
}
