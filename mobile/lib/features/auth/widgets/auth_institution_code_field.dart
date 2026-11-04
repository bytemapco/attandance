import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Asked for only when the same student ID exists at more than one college.
class AuthInstitutionCodeField extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSubmit;

  const AuthInstitutionCodeField({
    super.key,
    required this.controller,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final hintColor = isDark ? SasColors.maidenMist : const Color(0xFF475569);
    final fill = isDark ? SasColors.darkElevated : const Color(0xFFF8FAFC);
    final borderColor = isDark
        ? const Color(0x2EFFFFFF)
        : const Color(0xFFE2E8F0);
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: borderColor),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Institution code',
          style: SasTypography.style(
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          autocorrect: false,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => onSubmit(),
          style: SasTypography.style(fontSize: 15, color: textColor),
          decoration: InputDecoration(
            hintText: 'Given by your college',
            hintStyle: SasTypography.style(fontSize: 15, color: hintColor),
            filled: true,
            fillColor: fill,
            enabledBorder: border,
            focusedBorder: border,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
          ),
        ),
      ],
    );
  }
}
