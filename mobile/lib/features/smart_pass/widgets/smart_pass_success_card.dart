import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/domain/models/smart_pass.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';

/// Executive confirmation card displayed upon successful Smart Pass verification.
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderColor = isDark
        ? SasColors.darkBorder
        : SasColors.border;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: SasColors.success.withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(
                color: SasColors.success.withValues(alpha: 0.3),
                width: 1.5,
              ),
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              size: 36,
              color: SasColors.success,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            result.message.isNotEmpty
                ? result.message
                : 'Attendance Verified Successfully',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: SasColors.textPrimaryOf(context),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? SasColors.darkElevated : SasColors.lightElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark
                    ? SasColors.darkBorder
                    : SasColors.border,
              ),
            ),
            child: Column(
              children: [
                _infoRow(context, 'Class', result.className),
                _infoRow(context, 'Subject', result.subject),
                _infoRow(context, 'Student', result.studentName),
                _infoRow(
                  context,
                  'Status',
                  result.attendanceStatus,
                  isHighlight: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Scan Another Pass',
            icon: Icons.qr_code_scanner_rounded,
            onPressed: onScanAnother,
          ),
        ],
      ),
    );
  }

  Widget _infoRow(
    BuildContext context,
    String label,
    String value, {
    bool isHighlight = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: SasColors.textMutedOf(context),
            ),
          ),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: isHighlight ? FontWeight.w600 : FontWeight.w600,
              color: isHighlight
                  ? SasColors.success
                  : SasColors.textPrimaryOf(context),
            ),
          ),
        ],
      ),
    );
  }
}
