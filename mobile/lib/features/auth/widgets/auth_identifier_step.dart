import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/shared/widgets/glass_input.dart';

class AuthIdentifierStep extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onContinue;

  const AuthIdentifierStep({
    super.key,
    required this.formKey,
    required this.controller,
    required this.focusNode,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? SasColors.brilliance : SasColors.indianInk;

    return Form(
      key: formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Sign in',
            style: SasTypography.style(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              color: primaryTextColor,
            ),
          ),
          const SizedBox(height: 18),
          GlassInput(
            controller: controller,
            focusNode: focusNode,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => onContinue(),
            label: 'Student ID or Email',
            hint: 'STU-2026-001 or email',
            prefixIcon: Icons.badge_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Student ID is required';
              }
              if (value.trim().length < 3) {
                return 'At least 3 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: onContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: SasColors.osageOrange,
                foregroundColor: SasColors.brilliance,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Continue',
                    style: SasTypography.style(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: SasColors.brilliance,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    size: 18,
                    color: SasColors.brilliance,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}
