import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

class AuthIdentifierInputField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onSubmitted;
  final Color primaryTextColor;
  final Color subtitleColor;
  final Color inputBg;
  final Color inputBorder;

  const AuthIdentifierInputField({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.onSubmitted,
    required this.primaryTextColor,
    required this.subtitleColor,
    required this.inputBg,
    required this.inputBorder,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      textInputAction: TextInputAction.done,
      keyboardType: TextInputType.emailAddress,
      onFieldSubmitted: (_) => onSubmitted(),
      style: SasTypography.style(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: primaryTextColor,
      ),
      decoration: InputDecoration(
        hintText: 'STU-2026-001 or email',
        hintStyle: SasTypography.style(
          fontSize: 13.5,
          fontWeight: FontWeight.w400,
          color: subtitleColor,
        ),
        prefixIcon: Icon(
          Icons.person_outline_rounded,
          size: 19,
          color: subtitleColor,
        ),
        filled: true,
        fillColor: inputBg,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 10,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: inputBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: inputBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFF95721), width: 1.5),
        ),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter your student ID or email';
        }
        if (value.trim().length < 3) {
          return 'Identifier must be at least 3 characters';
        }
        return null;
      },
    );
  }
}
