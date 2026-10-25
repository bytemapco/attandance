import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/auth/widgets/login_error_banner.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/glass_input.dart';
import 'package:smart_attendance_app/shared/widgets/loading_overlay.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  bool _obscurePassword = true;


  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.status == AuthStatus.loading;

    return Scaffold(
      body: Stack(
        children: [
          AnimatedBackground(
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: SasColors.accentEmerald.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: SasColors.accentEmerald.withValues(alpha: 0.25),
                          ),
                        ),
                        child: const Icon(
                          Icons.school_rounded,
                          color: SasColors.accentEmerald,
                          size: 26,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Student Portal',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Smart Attendance Verification System',
                        style: TextStyle(color: SasColors.textMuted, fontSize: 13),
                      ),
                      const SizedBox(height: 28),
                      GlassCard(
                        padding: const EdgeInsets.all(24),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              GlassInput(
                                controller: _emailController,
                                focusNode: _emailFocusNode,
                                textInputAction: TextInputAction.next,
                                onFieldSubmitted: (_) =>
                                    _passwordFocusNode.requestFocus(),
                                label: 'Student ID or Email',
                                hint: 'e.g. STU-2026-001 or email',
                                prefixIcon: Icons.badge_outlined,
                                keyboardType: TextInputType.text,
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Student ID or Email is required';
                                  }
                                  if (v.trim().length < 3) {
                                    return 'At least 3 characters';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              GlassInput(
                                controller: _passwordController,
                                focusNode: _passwordFocusNode,
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _handleLogin(),
                                label: 'Password',
                                hint: '••••••••',
                                prefixIcon: Icons.lock_outline_rounded,
                                obscureText: _obscurePassword,
                                suffix: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: SasColors.textMuted,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  }),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Password is required';
                                  }
                                  if (v.length < 8) {
                                    return 'At least 8 characters';
                                  }
                                  return null;
                                },
                              ),
                              if (authState.errorMessage != null) ...[
                                const SizedBox(height: 16),
                                LoginErrorBanner(
                                  errorMessage: authState.errorMessage!,
                                  email: _emailController.text,
                                  password: _passwordController.text,
                                  isFormValid:
                                      _formKey.currentState?.validate() ?? false,
                                ),
                              ],
                              const SizedBox(height: 24),
                              GlassButton(
                                label: 'Sign In',
                                isExpanded: true,
                                isLoading: isLoading,
                                onPressed: isLoading ? null : _handleLogin,
                                icon: Icons.login_rounded,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Students only. Teachers use the web dashboard.',
                        style: TextStyle(color: SasColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (isLoading) const LoadingOverlay(message: 'Logging in...'),
        ],
      ),
    );
  }
}
