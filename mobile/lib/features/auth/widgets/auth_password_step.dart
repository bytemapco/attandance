import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/auth/widgets/login_error_banner.dart';
import 'package:smart_attendance_app/shared/widgets/glass_input.dart';

class AuthPasswordStep extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final String studentId;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool obscurePassword;
  final VoidCallback onToggleObscurePassword;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onBackPressed;
  final VoidCallback onSubmit;

  const AuthPasswordStep({
    super.key,
    required this.formKey,
    required this.studentId,
    required this.controller,
    required this.focusNode,
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
    final chipBg = isDark ? SasColors.darkCanvas : SasColors.polishWhite;
    final chipBorder = isDark ? SasColors.indianInk : SasColors.polishWhite;

    return Form(
      key: formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              InkWell(
                onTap: onBackPressed,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: chipBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.chevron_left_rounded,
                    color: primaryTextColor,
                    size: 22,
                  ),
                ),
              ),
              InkWell(
                onTap: onBackPressed,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: chipBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: chipBorder, width: 1.0),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.badge_outlined, size: 14, color: SasColors.textMuted),
                      const SizedBox(width: 6),
                      Text(
                        studentId,
                        style: SasTypography.style(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: primaryTextColor,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.edit_outlined, size: 12, color: SasColors.textMuted),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 36),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Enter password',
            style: SasTypography.style(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
              color: primaryTextColor,
            ),
          ),
          const SizedBox(height: 18),
          GlassInput(
            controller: controller,
            focusNode: focusNode,
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
              email: studentId,
              password: controller.text,
              isFormValid: formKey.currentState?.validate() ?? false,
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: SasColors.osageOrange,
                foregroundColor: SasColors.brilliance,
                elevation: 0,
                disabledBackgroundColor: SasColors.osageOrange.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
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
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Sign In',
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
        ],
      ),
    );
  }
}
