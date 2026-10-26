import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_hero_section.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_identifier_step.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_password_step.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_sheet_wrapper.dart';
import 'package:smart_attendance_app/shared/widgets/loading_overlay.dart';

enum _LoginStep { identifier, password }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _identifierFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _identifierFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();

  _LoginStep _step = _LoginStep.identifier;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _identifierFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  void _handleContinue() {
    if (!_identifierFormKey.currentState!.validate()) return;
    setState(() => _step = _LoginStep.password);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _passwordFocusNode.requestFocus();
    });
  }

  Future<void> _handleLogin() async {
    if (!_passwordFormKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).login(
          _identifierController.text.trim(),
          _passwordController.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.status == AuthStatus.loading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? SasColors.darkCanvas : SasColors.bgCanvas,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          const Positioned.fill(
            child: AuthHeroSection(),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: AuthSheetWrapper(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  child: _step == _LoginStep.identifier
                      ? AuthIdentifierStep(
                          key: const ValueKey('step_identifier'),
                          formKey: _identifierFormKey,
                          controller: _identifierController,
                          focusNode: _identifierFocusNode,
                          onContinue: _handleContinue,
                        )
                      : AuthPasswordStep(
                          key: const ValueKey('step_password'),
                          formKey: _passwordFormKey,
                          studentId: _identifierController.text.trim(),
                          controller: _passwordController,
                          focusNode: _passwordFocusNode,
                          obscurePassword: _obscurePassword,
                          onToggleObscurePassword: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                          isLoading: isLoading,
                          errorMessage: authState.errorMessage,
                          onBackPressed: () {
                            setState(() => _step = _LoginStep.identifier);
                          },
                          onSubmit: _handleLogin,
                        ),
                ),
              ),
            ),
          ),
          if (isLoading) const LoadingOverlay(message: 'Signing in...'),
        ],
      ),
    );
  }
}
