import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/smart_pass.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

/// Card displayed upon successful Smart Pass attendance verification.
class SmartPassSuccessCard extends StatelessWidget {
  final SmartPassScanResult result;
  final VoidCallback onScanAnother;

  const SmartPassSuccessCard({
    super.key,
    required this.result,
    required this.onScanAnother,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SasColors.accentEmerald.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              size: 48,
              color: SasColors.accentEmerald,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            result.message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: SasColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: SasColors.bgSurface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                _infoRow('Class', result.className),
                _infoRow('Subject', result.subject),
                _infoRow('Student', result.studentName),
                _infoRow('Status', result.attendanceStatus, isHighlight: true),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassButton(
            label: 'Scan Another Code',
            icon: Icons.qr_code_scanner_rounded,
            onPressed: onScanAnother,
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: SasColors.textMuted),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isHighlight ? FontWeight.w800 : FontWeight.w600,
              color: isHighlight
                  ? SasColors.accentEmerald
                  : SasColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
