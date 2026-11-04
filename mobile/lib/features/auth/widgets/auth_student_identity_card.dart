import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Warm identity preview card showing the student avatar, ID, and edit pencil
/// as seen on Screen 2 of the reference design.
class AuthStudentIdentityCard extends StatelessWidget {
  final String studentId;
  final VoidCallback onEdit;

  const AuthStudentIdentityCard({
    super.key,
    required this.studentId,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : SasColors.copperSoft;
    final cardBorder = isDark
        ? SasColors.textSecondary
        : SasColors.copperSoft;
    final idTextColor = isDark ? SasColors.ivory : SasColors.ink;
    final subtitleColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cardBorder, width: 1.2),
      ),
      child: Row(
        children: [
          // Student avatar
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: isDark ? SasColors.info : SasColors.infoSoft,
              shape: BoxShape.circle,
              border: Border.all(
                color: isDark
                    ? SasColors.info
                    : SasColors.infoBorder,
                width: 1.0,
              ),
            ),
            child: Center(
              child: Icon(
                Icons.school_rounded,
                color: isDark
                    ? SasColors.info
                    : SasColors.info,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Student details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        studentId,
                        style: SasTypography.style(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: idTextColor,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: onEdit,
                      borderRadius: BorderRadius.circular(10),
                      child: Padding(
                        padding: const EdgeInsets.all(2),
                        child: Icon(
                          Icons.edit_outlined,
                          size: 14,
                          color: subtitleColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'Student Account',
                  style: SasTypography.style(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: subtitleColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
