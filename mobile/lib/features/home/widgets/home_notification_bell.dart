import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Notification bell button with unread dot indicator.
class HomeNotificationBell extends StatelessWidget {
  final int unreadCount;
  final bool isDark;
  final VoidCallback onTap;

  const HomeNotificationBell({
    super.key,
    required this.unreadCount,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isDark ? SasColors.darkElevated : SasColors.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? const Color(0x1EFFFFFF) : const Color(0x14000000),
            width: 0.8,
          ),
          boxShadow: isDark
              ? null
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              unreadCount > 0
                  ? Icons.notifications_rounded
                  : Icons.notifications_outlined,
              size: 21,
              color: isDark ? SasColors.brilliance : SasColors.indianInk,
            ),
            if (unreadCount > 0)
              Positioned(
                top: 9,
                right: 9,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: SasColors.osageOrange,
                    border: Border.all(
                      color: isDark
                          ? SasColors.darkElevated
                          : SasColors.lightSurface,
                      width: 1.5,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
