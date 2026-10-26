import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Provide Explanation to Instructor',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: SasColors.textSecondary),
        ),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.all(14),
          child: noteSubmitted
              ? Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: SasColors.accentEmerald.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: SasColors.accentEmerald.withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_rounded, color: SasColors.accentEmerald, size: 18),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Note submitted. Your instructor will review it.',
                          style: TextStyle(color: SasColors.accentEmerald, fontSize: 12, fontWeight: FontWeight.w600),
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
                      style: const TextStyle(color: SasColors.textPrimary, fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: 'e.g. Back row seating with dim lighting...',
                        hintStyle: TextStyle(color: SasColors.textMuted, fontSize: 12),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GlassButton(
                      label: 'Send Note to Instructor',
                      isExpanded: true,
                      isLoading: isSubmitting,
                      icon: Icons.send_rounded,
                      onPressed: isSubmitting ? null : onSubmit,
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}
