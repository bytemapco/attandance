import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

class FlaggedTeacherNoteCard extends StatelessWidget {
  final String note;

  const FlaggedTeacherNoteCard({super.key, required this.note});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final photoMatch = RegExp(r'\[photo:(.*?)\]').firstMatch(note);
    final photoUrl = photoMatch?.group(1);
    final cleanText = note.replaceAll(RegExp(r'\[photo:.*?\]'), '').trim();

    if (photoUrl != null && cleanText.isEmpty) {
      return _buildPhotoSnapshot(photoUrl, isDark);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (photoUrl != null) ...[
          _buildPhotoSnapshot(photoUrl, isDark),
          const SizedBox(height: 12),
        ],
        if (cleanText.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? SasColors.darkSurface : SasColors.infoSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark
                    ? SasColors.textSecondary
                    : SasColors.infoBorder,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.rate_review_outlined,
                  color: SasColors.info,
                  size: 18,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Instructor note',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                          color: isDark
                              ? SasColors.info
                              : SasColors.info,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        cleanText,
                        style: GoogleFonts.plusJakartaSans(
                          color: isDark
                              ? Colors.white
                              : SasColors.darkSurface,
                          fontSize: 13,
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildPhotoSnapshot(String url, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.textSecondary : SasColors.ivory,
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              url,
              semanticLabel: "Teacher's attached photo",
              width: 52,
              height: 52,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: isDark
                      ? SasColors.textSecondary
                      : SasColors.ivory,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.person_rounded,
                  size: 24,
                  color: SasColors.mutedOnDark,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verification snapshot',
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                    color: isDark ? Colors.white : SasColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Captured during check-in for teacher review.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? SasColors.mutedOnDark
                        : SasColors.textMuted,
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
