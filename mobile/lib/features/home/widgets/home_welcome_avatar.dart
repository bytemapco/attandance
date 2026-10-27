import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// 52px student avatar with amber glow ring and initials.
class HomeWelcomeAvatar extends StatelessWidget {
  final String initials;
  final bool isDark;

  const HomeWelcomeAvatar({
    super.key,
    required this.initials,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            SasColors.osageOrange.withValues(alpha: isDark ? 0.30 : 0.20),
            SasColors.sunsetInItaly.withValues(alpha: isDark ? 0.18 : 0.12),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: SasColors.osageOrange.withValues(alpha: isDark ? 0.45 : 0.30),
          width: 1.5,
        ),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: SasColors.osageOrange.withValues(alpha: 0.18),
                  blurRadius: 12,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            color: SasColors.osageOrange,
            fontSize: 17,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
