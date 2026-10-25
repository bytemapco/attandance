import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/glass_input.dart';
import 'package:smart_attendance_app/shared/widgets/loading_overlay.dart';

class ForceChangePasswordScreen extends ConsumerStatefulWidget {
  const ForceChangePasswordScreen({super.key});

  @override
  ConsumerState<ForceChangePasswordScreen> createState() =>
      _ForceChangePasswordScreenState();
}

class _ForceChangePasswordScreenState
    extends ConsumerState<ForceChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await ref.read(authProvider.notifier).changePassword(
          _newPasswordController.text,
        );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password set successfully! Welcome to your account.'),
          backgroundColor: SasColors.accentEmerald,
        ),
      );
    }
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
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              SasColors.accentEmerald.withValues(alpha: 0.25),
                              SasColors.accentTeal.withValues(alpha: 0.1),
                            ],
                          ),
                          border: Border.all(
                            color: SasColors.accentEmerald.withValues(alpha: 0.3),
                          ),
                        ),
                        child: const Icon(
                          Icons.shield_outlined,
                          color: SasColors.accentEmerald,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Set Permanent Password',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Create a secure password to activate and protect your account',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: SasColors.textMuted, fontSize: 13),
                      ),
                      const SizedBox(height: 24),
                      GlassCard(
                        padding: const EdgeInsets.all(24),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              GlassInput(
                                controller: _newPasswordController,
                                label: 'New Permanent Password',
                                hint: 'Min. 8 characters',
                                prefixIcon: Icons.lock_outline_rounded,
                                obscureText: _obscureNew,
                                suffix: IconButton(
                                  icon: Icon(
                                    _obscureNew
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: SasColors.textMuted,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'New password is required';
                                  if (v.length < 8) return 'Must be at least 8 characters';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              GlassInput(
                                controller: _confirmPasswordController,
                                label: 'Confirm New Password',
                                hint: 'Re-enter permanent password',
                                prefixIcon: Icons.check_circle_outline_rounded,
                                obscureText: _obscureConfirm,
                                suffix: IconButton(
                                  icon: Icon(
                                    _obscureConfirm
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: SasColors.textMuted,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                                ),
                                validator: (v) {
                                  if (v != _newPasswordController.text) return 'Passwords do not match';
                                  return null;
                                },
                              ),
                              if (authState.errorMessage != null) ...[
                                const SizedBox(height: 16),
                                Text(
                                  authState.errorMessage!,
                                  style: const TextStyle(color: SasColors.danger, fontSize: 13),
                                ),
                              ],
                              const SizedBox(height: 24),
                              GlassButton(
                                label: 'Activate Account & Continue',
                                isExpanded: true,
                                isLoading: isLoading,
                                onPressed: isLoading ? null : _handleSubmit,
                                icon: Icons.check_rounded,
                              ),
                              const SizedBox(height: 12),
                              TextButton(
                                onPressed: () => ref.read(authProvider.notifier).logout(),
                                child: const Text(
                                  'Sign In with Different Account',
                                  style: TextStyle(color: SasColors.textMuted, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (isLoading) const LoadingOverlay(message: 'Activating account...'),
        ],
      ),
    );
  }
}
