import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_form_header.dart';
import 'package:smart_attendance_app/features/auth/widgets/login_error_banner.dart';
import 'package:smart_attendance_app/shared/widgets/glass_input.dart';

class AuthFormView extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final FocusNode emailFocusNode;
  final FocusNode passwordFocusNode;
  final bool obscurePassword;
  final VoidCallback onToggleObscurePassword;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onBackPressed;
  final VoidCallback onSubmit;

  const AuthFormView({
    super.key,
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.emailFocusNode,
    required this.passwordFocusNode,
    required this.obscurePassword,
    required this.onToggleObscurePassword,
    required this.isLoading,
    this.errorMessage,
    required this.onBackPressed,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? SasColors.brilliance : SasColors.indianInk;
    final primaryBtnBg = isDark ? SasColors.osageOrange : SasColors.indianInk;
    final dividerColor = isDark ? SasColors.indianInk : SasColors.polishWhite;

    return Form(
      key: formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AuthFormHeader(onBackPressed: onBackPressed),
          const SizedBox(height: 18),
          GlassInput(
            controller: emailController,
            focusNode: emailFocusNode,
            textInputAction: TextInputAction.next,
            onFieldSubmitted: (_) => passwordFocusNode.requestFocus(),
            label: 'Student ID or Email',
            hint: 'STU-2026-001 or email',
            prefixIcon: Icons.badge_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Student ID is required';
              if (v.trim().length < 3) return 'At least 3 characters';
              return null;
            },
          ),
          const SizedBox(height: 12),
          GlassInput(
            controller: passwordController,
            focusNode: passwordFocusNode,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => onSubmit(),
            label: 'Password',
            hint: '••••••••',
            prefixIcon: Icons.lock_outline_rounded,
            obscureText: obscurePassword,
            suffix: IconButton(
              icon: Icon(
                obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                color: SasColors.textMuted,
                size: 20,
              ),
              onPressed: onToggleObscurePassword,
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Password is required';
              if (v.length < 8) return 'At least 8 characters';
              return null;
            },
          ),
          if (errorMessage != null) ...[
            const SizedBox(height: 12),
            LoginErrorBanner(
              errorMessage: errorMessage!,
              email: emailController.text,
              password: passwordController.text,
              isFormValid: formKey.currentState?.validate() ?? false,
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBtnBg,
                foregroundColor: SasColors.brilliance,
                elevation: 0,
                disabledBackgroundColor: primaryBtnBg.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(27),
                ),
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor: AlwaysStoppedAnimation<Color>(SasColors.brilliance),
                      ),
                    )
                  : Text(
                      'Continue',
                      style: SasTypography.style(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: SasColors.brilliance,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: Divider(color: dividerColor, thickness: 1)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text(
                  'or',
                  style: SasTypography.style(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: SasColors.textMuted,
                  ),
                ),
              ),
              Expanded(child: Divider(color: dividerColor, thickness: 1)),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 52,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                foregroundColor: primaryTextColor,
                side: BorderSide(color: dividerColor, width: 1.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.account_balance_rounded, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Campus Portal SSO',
                    style: SasTypography.style(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: primaryTextColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
