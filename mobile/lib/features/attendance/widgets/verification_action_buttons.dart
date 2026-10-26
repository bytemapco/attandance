import 'package:flutter/material.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

class VerificationActionButtons extends StatelessWidget {
  final String primaryLabel;
  final IconData? primaryIcon;
  final VoidCallback? onPrimaryPressed;
  final String? secondaryLabel;
  final IconData? secondaryIcon;
  final VoidCallback? onSecondaryPressed;
  final bool isSecondaryGhost;

  const VerificationActionButtons({
    super.key,
    required this.primaryLabel,
    this.primaryIcon,
    this.onPrimaryPressed,
    this.secondaryLabel,
    this.secondaryIcon,
    this.onSecondaryPressed,
    this.isSecondaryGhost = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (secondaryLabel != null) ...[
          Expanded(
            child: GlassButton(
              label: secondaryLabel!,
              variant: isSecondaryGhost ? GlassButtonVariant.ghost : GlassButtonVariant.secondary,
              icon: secondaryIcon,
              onPressed: onSecondaryPressed,
            ),
          ),
          const SizedBox(width: 12),
        ],
        Expanded(
          child: GlassButton(
            label: primaryLabel,
            icon: primaryIcon,
            onPressed: onPrimaryPressed,
          ),
        ),
      ],
    );
  }
}
