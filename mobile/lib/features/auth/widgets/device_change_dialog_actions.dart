import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

class DeviceChangeActions extends StatelessWidget {
  final bool isLoading;
  final Color secondaryText;
  final VoidCallback onCancel;
  final VoidCallback onSubmit;

  const DeviceChangeActions({
    super.key,
    required this.isLoading,
    required this.secondaryText,
    required this.onCancel,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        TextButton(
          onPressed: isLoading ? null : onCancel,
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            'Cancel',
            style: SasTypography.style(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: secondaryText,
            ),
          ),
        ),
        const SizedBox(width: 8),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFF7A18), Color(0xFFF95721)],
            ),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF95721).withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ElevatedButton(
            onPressed: isLoading ? null : onSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    'Submit Request',
                    style: SasTypography.style(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
