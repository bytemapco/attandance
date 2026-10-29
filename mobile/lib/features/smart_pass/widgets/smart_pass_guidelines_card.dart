import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Executive guidelines card presenting the 3-step verification architecture.
class SmartPassGuidelinesCard extends StatelessWidget {
  const SmartPassGuidelinesCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderColor = isDark
        ? const Color(0x1EFFFFFF)
        : const Color(0x140F172A);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF95721).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.verified_user_rounded,
                  size: 16,
                  color: Color(0xFFF95721),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Verification Protocol',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: SasColors.textPrimaryOf(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _stepRow(
            context: context,
            number: '01',
            title: 'Dynamic QR',
            desc: "Scans instructor's time-sensitive attendance token.",
          ),
          const SizedBox(height: 10),
          _stepRow(
            context: context,
            number: '02',
            title: 'Classroom Proximity',
            desc: 'Verifies GPS coordinates match the scheduled hall.',
          ),
          const SizedBox(height: 10),
          _stepRow(
            context: context,
            number: '03',
            title: 'Device Signature',
            desc: 'Binds attendance to your registered device identifier.',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _stepRow({
    required BuildContext context,
    required String number,
    required String title,
    required String desc,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: const Color(0xFFF95721).withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(
              color: const Color(0xFFF95721).withValues(alpha: 0.25),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            number,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: const Color(0xFFF95721),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: SasColors.textPrimaryOf(context),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: SasColors.textMutedOf(context),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
