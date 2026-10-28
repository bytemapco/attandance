import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        if (secondaryLabel != null) ...[
          Expanded(
            child: SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: onSecondaryPressed,
                icon: secondaryIcon != null
                    ? Icon(secondaryIcon, size: 18, color: isDark ? Colors.white : const Color(0xFF0F172A))
                    : const SizedBox.shrink(),
                label: Text(
                  secondaryLabel!,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                    width: 1.2,
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
        ],
        Expanded(
          child: SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: onPrimaryPressed,
              icon: primaryIcon != null
                  ? Icon(primaryIcon, size: 18, color: Colors.white)
                  : const SizedBox.shrink(),
              label: Text(
                primaryLabel,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF95721),
                elevation: 1,
                shadowColor: const Color(0xFFF95721).withValues(alpha: 0.35),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
