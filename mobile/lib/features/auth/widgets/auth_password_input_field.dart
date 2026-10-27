import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Password input text field with show/hide toggle and validation.
class AuthPasswordInputField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool obscurePassword;
  final VoidCallback onToggleObscurePassword;
  final VoidCallback onSubmit;
  final Color primaryTextColor;
  final Color subtitleColor;
  final Color inputBg;
  final Color inputBorder;

  const AuthPasswordInputField({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.obscurePassword,
    required this.onToggleObscurePassword,
    required this.onSubmit,
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
      obscureText: obscurePassword,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: (_) => onSubmit(),
      style: SasTypography.style(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: primaryTextColor,
      ),
      decoration: InputDecoration(
        hintText: '••••••••••••',
        hintStyle: SasTypography.style(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: subtitleColor,
        ),
        prefixIcon: Icon(
          Icons.lock_outline_rounded,
          size: 20,
          color: subtitleColor,
        ),
        suffixIcon: IconButton(
          icon: Icon(
            obscurePassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            size: 20,
            color: subtitleColor,
          ),
          onPressed: onToggleObscurePassword,
        ),
        filled: true,
        fillColor: inputBg,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
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
          borderSide: const BorderSide(
            color: Color(0xFFF95721),
            width: 1.5,
          ),
        ),
      ),
      validator: (v) {
        if (v == null || v.isEmpty) {
          return 'Please enter your password';
        }
        if (v.length < 8) {
          return 'Password must be at least 8 characters';
        }
        return null;
      },
    );
  }
}
