import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_brand_header.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_gradient_button.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_password_input_field.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_security_badge.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_student_identity_card.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_wave_painter.dart';
import 'package:smart_attendance_app/features/auth/widgets/login_error_banner.dart';
import 'package:smart_attendance_app/shared/widgets/fade_slide_transition.dart';

/// Step 2: Full-screen view for entering password matching reference design.
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
    final primaryTextColor =
        isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final subtitleColor =
        isDark ? SasColors.maidenMist : const Color(0xFF475569);
    final inputBg = isDark ? SasColors.darkElevated : const Color(0xFFF8FAFC);
    final inputBorder =
        isDark ? const Color(0x2EFFFFFF) : const Color(0xFFE2E8F0);

    return SizedBox.expand(
      child: ColoredBox(
        color: isDark ? SasColors.darkCanvas : const Color(0xFFFFFDF9),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Bottom soft wave art
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: 310,
              child: IgnorePointer(
                child: CustomPaint(
                  painter: AuthWavePainter(isDark: isDark),
                ),
              ),
            ),

            SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    physics: const ClampingScrollPhysics(),
                    child: ConstrainedBox(
                      constraints:
                          BoxConstraints(minHeight: constraints.maxHeight),
                      child: IntrinsicHeight(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 12),
                          child: Form(
                            key: formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                FadeSlideTransition(
                                  delay: Duration.zero,
                                  beginOffset: const Offset(-0.04, 0),
                                  child: AuthBrandHeader(
                                    onBackPressed: onBackPressed,
                                    isLightBackground: !isDark,
                                  ),
                                ),
                                const SizedBox(height: 36),
                                FadeSlideTransition(
                                  delay: const Duration(milliseconds: 60),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Welcome Back!',
                                        style: SasTypography.style(
                                          fontSize: 28,
                                          fontWeight: FontWeight.w600,
                                          letterSpacing: -0.6,
                                          color: primaryTextColor,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Enter your password to access your account',
                                        style: SasTypography.style(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w400,
                                          color: subtitleColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 28),
                                FadeSlideTransition(
                                  delay: const Duration(milliseconds: 110),
                                  child: AuthStudentIdentityCard(
                                    studentId: studentId,
                                    onEdit: onBackPressed,
                                  ),
                                ),
                                const SizedBox(height: 28),
                                FadeSlideTransition(
                                  delay: const Duration(milliseconds: 160),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Password',
                                        style: SasTypography.style(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w600,
                                          color: primaryTextColor,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      AuthPasswordInputField(
                                        controller: controller,
                                        focusNode: focusNode,
                                        obscurePassword: obscurePassword,
                                        onToggleObscurePassword:
                                            onToggleObscurePassword,
                                        onSubmit: onSubmit,
                                        primaryTextColor: primaryTextColor,
                                        subtitleColor: subtitleColor,
                                        inputBg: inputBg,
                                        inputBorder: inputBorder,
                                      ),
                                    ],
                                  ),
                                ),
                                if (errorMessage != null) ...[
                                  const SizedBox(height: 14),
                                  LoginErrorBanner(
                                    errorMessage: errorMessage!,
                                    email: studentId,
                                    password: controller.text,
                                    isFormValid: formKey.currentState
                                            ?.validate() ??
                                        false,
                                  ),
                                ],
                                const SizedBox(height: 28),
                                FadeSlideTransition(
                                  delay: const Duration(milliseconds: 210),
                                  child: AuthGradientButton(
                                    label: 'Sign In',
                                    onPressed: onSubmit,
                                    isLoading: isLoading,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                FadeSlideTransition(
                                  delay: const Duration(milliseconds: 240),
                                  child: AuthSecurityBadge(
                                      textColor: subtitleColor),
                                ),
                                const Spacer(),
                                const SizedBox(height: 32),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
