import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

class FlaggedNoteForm extends StatelessWidget {
  final TextEditingController controller;
  final bool isSubmitting;
  final bool noteSubmitted;
  final VoidCallback onSubmit;

  const FlaggedNoteForm({
    super.key,
    required this.controller,
    required this.isSubmitting,
    required this.noteSubmitted,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Provide explanation to instructor',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isDark ? SasColors.mutedOnDark : SasColors.textMuted,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? SasColors.darkSurface : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? SasColors.textSecondary : SasColors.ivory,
            ),
          ),
          child: noteSubmitted
              ? Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: SasColors.successSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SasColors.successBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        color: SasColors.success,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Note submitted. Your instructor will review it.',
                          style: GoogleFonts.plusJakartaSans(
                            color: SasColors.success,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: controller,
                      maxLines: 3,
                      maxLength: 300,
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white : SasColors.ink,
                        fontSize: 13.5,
                      ),
                      decoration: InputDecoration(
                        hintText: 'e.g. Back row seating with dim lighting...',
                        hintStyle: GoogleFonts.plusJakartaSans(
                          color: isDark
                              ? SasColors.textMuted
                              : SasColors.mutedOnDark,
                          fontSize: 13,
                        ),
                        filled: true,
                        fillColor: isDark
                            ? SasColors.ink
                            : SasColors.ivory,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: isDark
                                ? SasColors.textSecondary
                                : SasColors.ivory,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: isDark
                                ? SasColors.textSecondary
                                : SasColors.ivory,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: SasColors.copper,
                            width: 1.5,
                          ),
                        ),
                        contentPadding: const EdgeInsets.all(14),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: isSubmitting ? null : onSubmit,
                        icon: isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(
                                Icons.send_rounded,
                                size: 18,
                                color: Colors.white,
                              ),
                        label: Text(
                          isSubmitting
                              ? 'Sending...'
                              : 'Submit note to instructor',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: SasColors.copper,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}
