import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF0F9FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF334155)
                    : const Color(0xFFBAE6FD),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.rate_review_outlined,
                  color: Color(0xFF0284C7),
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
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: isDark
                              ? const Color(0xFF38BDF8)
                              : const Color(0xFF0284C7),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        cleanText,
                        style: GoogleFonts.plusJakartaSans(
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF1E293B),
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
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              url,
              width: 52,
              height: 52,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF334155)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.person_rounded,
                  size: 24,
                  color: Color(0xFF94A3B8),
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
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Captured during check-in for teacher review.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF64748B),
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
