import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/auth/providers/reset_password_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/glass_input.dart';
import 'package:smart_attendance_app/shared/widgets/loading_overlay.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String token;
  const ResetPasswordScreen({super.key, required this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _obscureConfirm = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(resetPasswordProvider.notifier).verifyToken(widget.token);
    });
  }

  @override
  void dispose() {
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await ref.read(resetPasswordProvider.notifier).submitReset(
          token: widget.token,
          newPassword: _passCtrl.text,
        );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset successfully! Please log in.'),
          backgroundColor: SasColors.accentEmerald,
        ),
      );
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(resetPasswordProvider);

    return Scaffold(
      body: Stack(
        children: [
          AnimatedBackground(
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: state.isVerifying
                      ? _buildLoadingCard()
                      : (!state.isValid && !state.isSuccess)
                          ? _buildInvalidCard(state.errorMessage)
                          : _buildResetForm(state),
                ),
              ),
            ),
          ),
          if (state.isSubmitting) const LoadingOverlay(message: 'Updating password...'),
        ],
      ),
    );
  }

  Widget _buildLoadingCard() {
    return const GlassCard(
      padding: EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(strokeWidth: 2.5),
          SizedBox(height: 20),
          Text('Verifying reset link...', style: TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildInvalidCard(String? error) {
    return GlassCard(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SasColors.danger.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.error_outline, color: SasColors.danger, size: 36),
          ),
          const SizedBox(height: 16),
          const Text('Invalid or Expired Link',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(error ?? 'This reset link is invalid or has already been used.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: SasColors.textMuted, fontSize: 13)),
          const SizedBox(height: 24),
          GlassButton(label: 'Back to Login', isExpanded: true, onPressed: () => context.go('/login')),
        ],
      ),
    );
  }

  Widget _buildResetForm(ResetPasswordState state) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: SasColors.accentEmerald.withValues(alpha: 0.15),
            border: Border.all(color: SasColors.accentEmerald.withValues(alpha: 0.3)),
          ),
          child: const Icon(Icons.lock_reset_rounded, color: SasColors.accentEmerald, size: 28),
        ),
        const SizedBox(height: 16),
        Text('Reset Password',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text('Create a new password for ${state.email ?? "your account"}',
            textAlign: TextAlign.center,
            style: const TextStyle(color: SasColors.textMuted, fontSize: 13)),
        const SizedBox(height: 24),
        GlassCard(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                GlassInput(
                  controller: _passCtrl,
                  label: 'New Password',
                  hint: 'Min 8 chars, letters & digits',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscurePass,
                  suffix: IconButton(
                    icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscurePass = !_obscurePass),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 8) return 'Must be at least 8 characters';
                    if (!RegExp(r'[A-Za-z]').hasMatch(v) || !RegExp(r'[0-9]').hasMatch(v)) {
                      return 'Must contain letters and numbers';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                GlassInput(
                  controller: _confirmCtrl,
                  label: 'Confirm New Password',
                  hint: 'Re-enter your password',
                  prefixIcon: Icons.lock_clock_outlined,
                  obscureText: _obscureConfirm,
                  suffix: IconButton(
                    icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                  validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null,
                ),
                const SizedBox(height: 24),
                GlassButton(label: 'Update Password', isExpanded: true, onPressed: _submit),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
