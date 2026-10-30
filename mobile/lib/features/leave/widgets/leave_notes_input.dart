import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class LeaveNotesInput extends StatelessWidget {
  final TextEditingController controller;

  const LeaveNotesInput({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Reason Details & Notes',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondaryOf(context),
          ),
        ),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: controller,
            maxLines: 3,
            maxLength: 300,
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 13,
            ),
            decoration: const InputDecoration(
              hintText: 'Provide additional context for your instructor...',
              hintStyle: TextStyle(
                color: SasColors.textMuted,
                fontSize: 12,
              ),
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
      ],
    );
  }
}
