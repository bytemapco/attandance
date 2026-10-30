import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_hero_section.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_identifier_step.dart';
import 'package:smart_attendance_app/features/auth/widgets/auth_password_step.dart';
import 'package:smart_attendance_app/shared/widgets/fade_slide_transition.dart';
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
    FocusScope.of(context).unfocus();
    setState(() => _step = _LoginStep.password);
  }

  Future<void> _handleLogin() async {
    if (!_passwordFormKey.currentState!.validate()) return;
    await ref
        .read(authProvider.notifier)
        .login(_identifierController.text.trim(), _passwordController.text);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.status == AuthStatus.loading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: _step == _LoginStep.identifier,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _step == _LoginStep.password) {
          setState(() => _step = _LoginStep.identifier);
        }
      },
      child: Scaffold(
        backgroundColor: isDark ? SasColors.darkCanvas : Colors.white,
        resizeToAvoidBottomInset: true,
        body: Stack(
          fit: StackFit.expand,
          children: [
            SizedBox.expand(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 320),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.04, 0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: _step == _LoginStep.identifier
                    ? _buildIdentifierScreen(isDark)
                    : _buildPasswordScreen(authState, isLoading),
              ),
            ),
            if (isLoading) const LoadingOverlay(message: 'Signing in...'),
          ],
        ),
      ),
    );
  }

  Widget _buildIdentifierScreen(bool isDark) {
    final isKeyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;
    return KeyedSubtree(
      key: const ValueKey('step_identifier'),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Full-screen Golden Hour Campus Walk photography backdrop
          Positioned.fill(
            child: Image.asset(
              'assets/images/auth_hero.png',
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
            ),
          ),

          // Protective subtle tint in dark mode
          if (isDark)
            Positioned.fill(
              child: ColoredBox(color: Colors.black.withValues(alpha: 0.35)),
            ),

          // Top Hero Section with brand logo, headline & 3-feature card
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isKeyboardOpen ? 0.0 : 1.0,
              child: IgnorePointer(
                ignoring: isKeyboardOpen,
                child: const AuthHeroSection(),
              ),
            ),
          ),

          // Bottom Sign In Sheet
          Align(
            alignment: Alignment.bottomCenter,
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: FadeSlideTransition(
                delay: const Duration(milliseconds: 140),
                beginOffset: const Offset(0, 0.08),
                child: AuthIdentifierStep(
                  formKey: _identifierFormKey,
                  controller: _identifierController,
                  focusNode: _identifierFocusNode,
                  onContinue: _handleContinue,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordScreen(AuthStateData authState, bool isLoading) {
    return KeyedSubtree(
      key: const ValueKey('step_password'),
      child: AuthPasswordStep(
        formKey: _passwordFormKey,
        studentId: _identifierController.text.trim(),
        controller: _passwordController,
        focusNode: _passwordFocusNode,
        obscurePassword: _obscurePassword,
        onToggleObscurePassword: () {
          setState(() => _obscurePassword = !_obscurePassword);
        },
        isLoading: isLoading,
        errorMessage: authState.errorMessage,
        onBackPressed: () {
          setState(() => _step = _LoginStep.identifier);
        },
        onSubmit: _handleLogin,
      ),
    );
  }
}
