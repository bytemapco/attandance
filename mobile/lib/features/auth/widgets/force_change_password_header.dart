import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

class ForceChangePasswordHeader extends StatelessWidget {
  const ForceChangePasswordHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: SasColors.osageOrange.withValues(alpha: 0.12),
            border: Border.all(
              color: SasColors.osageOrange.withValues(alpha: 0.35),
              width: 1.2,
            ),
          ),
          child: const Icon(
            Icons.shield_outlined,
            color: SasColors.osageOrange,
            size: 26,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Set Permanent Password',
          style: Theme.of(context).textTheme.headlineMedium
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        const Text(
          'Create a secure password to activate and protect your account',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: SasColors.textMuted,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
