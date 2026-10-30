import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_gradient_button.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_identifier_input_field.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_wave_painter.dart';

/// Step 1: Bottom sheet for entering Student ID or Email.
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
    final sheetBg = isDark ? SasColors.darkSurface : Colors.white;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? SasColors.maidenMist
        : const Color(0xFF475569);
    final inputBg = isDark ? SasColors.darkElevated : const Color(0xFFF8FAFC);
    final inputBorder = isDark
        ? const Color(0x2EFFFFFF)
        : const Color(0xFFE2E8F0);

    return Align(
      alignment: Alignment.bottomCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: sheetBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                blurRadius: 24,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            child: Stack(
              children: [
                // Soft organic wave background at bottom edge
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 75,
                  child: IgnorePointer(
                    child: RepaintBoundary(
                      child: CustomPaint(
                        painter: AuthWavePainter(isDark: isDark),
                      ),
                    ),
                  ),
                ),

                SafeArea(
                  top: false,
                  bottom: true,
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      22,
                      10,
                      22,
                      16 +
                          (MediaQuery.of(context).viewInsets.bottom > 0
                              ? 6
                              : 10),
                    ),
                    child: Form(
                      key: formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Top grab handle
                          Center(
                            child: Container(
                              width: 36,
                              height: 4,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF334155)
                                    : const Color(0xFFCBD5E1),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Title & Subtitle
                          Text(
                            'Sign in',
                            style: SasTypography.style(
                              fontSize: 24,
                              fontWeight: FontWeight.w600,
                              letterSpacing: -0.5,
                              color: primaryTextColor,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Enter your student ID or email to continue',
                            style: SasTypography.style(
                              fontSize: 13,
                              fontWeight: FontWeight.w400,
                              color: subtitleColor,
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Input Label (w600)
                          Text(
                            'Student ID or Email',
                            style: SasTypography.style(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: primaryTextColor,
                            ),
                          ),
                          const SizedBox(height: 6),

                          // Text Field
                          AuthIdentifierInputField(
                            controller: controller,
                            focusNode: focusNode,
                            onSubmitted: onContinue,
                            primaryTextColor: primaryTextColor,
                            subtitleColor: subtitleColor,
                            inputBg: inputBg,
                            inputBorder: inputBorder,
                          ),
                          const SizedBox(height: 12),

                          // Continue Button
                          AuthGradientButton(
                            label: 'Continue',
                            onPressed: onContinue,
                          ),
                          const SizedBox(height: 4),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
