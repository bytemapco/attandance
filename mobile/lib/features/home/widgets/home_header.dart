import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Home screen header: avatar, student name, institution and notifications.
class HomeHeader extends StatelessWidget {
  final dynamic user;
  final int unreadCount;
  final VoidCallback onNotificationTap;

  const HomeHeader({
    super.key,
    required this.user,
    required this.unreadCount,
    required this.onNotificationTap,
  });

  String _getInitials() {
    final first = user?.studentProfile?.firstName as String? ?? '';
    final last = user?.studentProfile?.lastName as String? ?? '';
    if (first.isNotEmpty && last.isNotEmpty) {
      return '${first[0]}${last[0]}'.toUpperCase();
    }
    final email = user?.email as String? ?? '';
    return email.isNotEmpty ? email[0].toUpperCase() : 'S';
  }

  String _getFirstName() {
    final first = user?.studentProfile?.firstName as String? ?? '';
    if (first.isNotEmpty) return first;
    final email = user?.email as String? ?? 'Student';
    return email.split('@').first;
  }

  String _getInstitution() => user?.tenantName as String? ?? '';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = SasColors.textPrimaryOf(context);
    final subtitleColor = SasColors.textMutedOf(context);
    final institution = _getInstitution();

    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkElevated : SasColors.copperSoft,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? SasColors.darkBorder : SasColors.border,
            ),
          ),
          child: Center(
            child: Text(
              _getInitials(),
              style: SasTypography.style(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDark ? SasColors.ivory : SasColors.copperStrong,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _getFirstName(),
                style: SasTypography.style(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: primaryTextColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (institution.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  institution,
                  style: SasTypography.style(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: subtitleColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
        InkWell(
          onTap: onNotificationTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isDark ? SasColors.darkSurface : SasColors.lightSurface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? SasColors.darkBorder : SasColors.border,
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  Icons.notifications_none_rounded,
                  size: 22,
                  color: primaryTextColor,
                ),
                if (unreadCount > 0)
                  Positioned(
                    top: 10,
                    right: 11,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: SasColors.copper,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
