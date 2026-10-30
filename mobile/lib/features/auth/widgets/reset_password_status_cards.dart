import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class ResetPasswordLoadingCard extends StatelessWidget {
  const ResetPasswordLoadingCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const GlassCard(
      padding: EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(strokeWidth: 2.5),
          SizedBox(height: 20),
          Text(
            'Verifying reset link...',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class ResetPasswordInvalidCard extends StatelessWidget {
  final String? errorMessage;

  const ResetPasswordInvalidCard({super.key, this.errorMessage});

  @override
  Widget build(BuildContext context) {
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
            child: const Icon(
              Icons.error_outline,
              color: SasColors.danger,
              size: 36,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Invalid or Expired Link',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            errorMessage ?? 'This reset link is invalid or has already been used.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: SasColors.textMuted, fontSize: 13),
          ),
          const SizedBox(height: 24),
          GlassButton(
            label: 'Back to Login',
            isExpanded: true,
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
    );
  }
}
