import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VerificationStatusOverlay extends StatelessWidget {
  final String title;
  final String? subtitle;
  final int? activeStepIndex;
  final List<String>? stepLabels;

  const VerificationStatusOverlay({
    super.key,
    required this.title,
    this.subtitle,
    this.activeStepIndex,
    this.stepLabels,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalSteps = stepLabels?.length ?? 4;
    final currentIndex = (activeStepIndex ?? 0).clamp(0, totalSteps - 1);
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderCol = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final mutedTextCol = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderCol),
                ),
                child: Center(
                  child: Icon(
                    Icons.verified_user_outlined,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Verifying Attendance',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: primaryTextColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Step ${currentIndex + 1} of $totalSteps',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        color: mutedTextCol,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (currentIndex + 1) / totalSteps,
              backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF95721)),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 16),
          if (stepLabels != null)
            Column(
              children: List.generate(stepLabels!.length, (index) {
                final isDone = index < currentIndex;
                final isCurrent = index == currentIndex;
                final rawLabel = stepLabels![index].replaceAll('...', '');

                Color textColor;
                FontWeight fontWeight;
                Widget leadingIcon;

                if (isDone) {
                  textColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155);
                  fontWeight = FontWeight.w500;
                  leadingIcon = const Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF08A875),
                    size: 18,
                  );
                } else if (isCurrent) {
                  textColor = primaryTextColor;
                  fontWeight = FontWeight.w700;
                  leadingIcon = const SizedBox(
                    width: 15,
                    height: 15,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF95721)),
                    ),
                  );
                } else {
                  textColor = mutedTextCol;
                  fontWeight = FontWeight.w400;
                  leadingIcon = Icon(
                    Icons.radio_button_unchecked_rounded,
                    color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                    size: 16,
                  );
                }

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      SizedBox(width: 20, height: 20, child: Center(child: leadingIcon)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          rawLabel,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13.5,
                            fontWeight: fontWeight,
                            color: textColor,
                          ),
                        ),
                      ),
                      if (isCurrent)
                        Text(
                          'Checking...',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFFF95721),
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }
}
