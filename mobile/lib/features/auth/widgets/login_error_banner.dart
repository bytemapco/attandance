import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/auth/widgets/device_change_dialog.dart';

class LoginErrorBanner extends StatelessWidget {
  final String errorMessage;
  final String email;
  final String password;
  final bool isFormValid;

  const LoginErrorBanner({
    super.key,
    required this.errorMessage,
    required this.email,
    required this.password,
    required this.isFormValid,
  });

  @override
  Widget build(BuildContext context) {
    final isDeviceBound =
        errorMessage == 'Access forbidden' || errorMessage.contains('bound');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: SasColors.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SasColors.danger.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: SasColors.danger,
                size: 18,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  errorMessage,
                  style: const TextStyle(
                    color: SasColors.danger,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          if (isDeviceBound) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                if (!isFormValid) return;
                final success = await showDialog<bool>(
                  context: context,
                  builder: (context) => DeviceChangeDialog(
                    email: email.trim(),
                    password: password,
                  ),
                );
                if (success == true && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Request sent! Please ask your teacher to approve your new device.',
                      ),
                      backgroundColor: SasColors.success,
                    ),
                  );
                }
              },
              icon: const Icon(Icons.smartphone_rounded, size: 16),
              label: const Text('Request Device Change'),
              style: OutlinedButton.styleFrom(
                foregroundColor: SasColors.osageOrange,
                side: BorderSide(
                  color: SasColors.osageOrange.withValues(alpha: 0.5),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
