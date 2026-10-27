import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Reusable section header with amber badge icon used on HomeScreen.
class HomeSectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final Widget? action;

  const HomeSectionHeader({
    super.key,
    required this.icon,
    required this.label,
    this.trailing,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: SasColors.osageOrange.withValues(alpha: isDark ? 0.20 : 0.10),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: SasColors.osageOrange,
            size: 14,
          ),
        ),
        const SizedBox(width: 9),
        Text(
          label,
          style: TextStyle(
            color: isDark ? SasColors.brilliance : SasColors.indianInk,
            fontSize: 15,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: 7),
          trailing!,
        ],
        const Spacer(),
        if (action != null) action!,
      ],
    );
  }
}

/// Pill count badge used next to section titles.
class HomeCountBadge extends StatelessWidget {
  final int count;
  const HomeCountBadge({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: SasColors.osageOrange.withValues(alpha: isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
          color: SasColors.osageOrange,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
