import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Top header for Home Screen matching modern campus aesthetic from reference design.
class HomeModernHeader extends StatelessWidget {
  final dynamic user;
  final int unreadCount;
  final VoidCallback onNotificationTap;

  const HomeModernHeader({
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
    return email.isNotEmpty ? email[0].toUpperCase() : 'AM';
  }

  String _getFirstName() {
    final first = user?.studentProfile?.firstName as String? ?? '';
    if (first.isNotEmpty) return first;
    final email = user?.email as String? ?? 'Alex';
    return email.split('@').first;
  }

  String _getInstitution() {
    final tenant = user?.tenantName as String? ?? '';
    return tenant.isNotEmpty ? tenant : 'Apex Institute of Technology';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFFE2E8F0)
        : const Color(0xFF475569);

    return Row(
      children: [
        // Rounded peach avatar container with thick white border
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFEDD5), Color(0xFFFFD8B8)],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white, width: 3.5),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF97316).withValues(alpha: 0.18),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Center(
            child: Text(
              _getInitials(),
              style: SasTypography.style(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: const Color(0xFFEA580C),
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Welcome greetings & institute
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      'Hello, ${_getFirstName()}',
                      style: SasTypography.style(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: primaryTextColor,
                        letterSpacing: -0.4,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 5),
                  const Text('👋', style: TextStyle(fontSize: 18)),
                ],
              ),
              const SizedBox(height: 3),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: Text(
                      _getInstitution(),
                      style: SasTypography.style(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: subtitleColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 3),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Color(0xFFF95721),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Notification Bell Button
        InkWell(
          onTap: onNotificationTap,
          borderRadius: BorderRadius.circular(24),
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isDark ? SasColors.darkSurface : Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  Icons.notifications_rounded,
                  size: 21,
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
                        color: Color(0xFFF95721),
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
