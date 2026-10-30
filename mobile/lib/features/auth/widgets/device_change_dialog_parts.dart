import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

class DeviceChangeHeader extends StatelessWidget {
  final bool isDark;
  final Color primaryText;

  const DeviceChangeHeader({
    super.key,
    required this.isDark,
    required this.primaryText,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFFF95721).withValues(alpha: isDark ? 0.20 : 0.10),
            shape: BoxShape.circle,
            border: Border.all(
              color: const Color(0xFFF95721).withValues(alpha: 0.25),
              width: 1,
            ),
          ),
          child: const Center(
            child: Icon(
              Icons.phonelink_lock_rounded,
              color: Color(0xFFF95721),
              size: 22,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Device Authorization',
                style: SasTypography.style(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: primaryText,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Hardware Mismatch Detected',
                style: SasTypography.style(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFFF95721),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class DeviceChangeReasonInput extends StatelessWidget {
  final TextEditingController controller;
  final Color inputBg;
  final Color inputBorder;
  final Color primaryText;
  final Color secondaryText;

  const DeviceChangeReasonInput({
    super.key,
    required this.controller,
    required this.inputBg,
    required this.inputBorder,
    required this.primaryText,
    required this.secondaryText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Reason for Change',
          style: SasTypography.style(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: primaryText,
          ),
        ),
        const SizedBox(height: 7),
        TextField(
          controller: controller,
          maxLines: 2,
          minLines: 1,
          style: SasTypography.style(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: primaryText,
          ),
          decoration: InputDecoration(
            hintText: 'e.g., Bought a new phone, reset device',
            hintStyle: SasTypography.style(
              fontSize: 13.5,
              fontWeight: FontWeight.w400,
              color: secondaryText.withValues(alpha: 0.8),
            ),
            filled: true,
            fillColor: inputBg,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: inputBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: inputBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: Color(0xFFF95721),
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
