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
    final isDeviceBound = errorMessage == 'Access forbidden' ||
        errorMessage.contains('bound');

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: SasColors.accentPink.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: SasColors.accentPink.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.error_outline, color: SasColors.danger, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  errorMessage,
                  style: const TextStyle(color: SasColors.danger, fontSize: 13),
                ),
              ),
            ],
          ),
          if (isDeviceBound) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
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
                      backgroundColor: SasColors.accentEmerald,
                    ),
                  );
                }
              },
              icon: const Icon(Icons.smartphone, size: 16),
              label: const Text('Request Device Change'),
              style: ElevatedButton.styleFrom(
                backgroundColor: SasColors.bgSurface,
                foregroundColor: SasColors.accentEmerald,
                side: const BorderSide(color: SasColors.accentEmerald),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
