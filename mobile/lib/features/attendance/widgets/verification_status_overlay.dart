import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

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
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? SasColors.textSecondary
        : SasColors.textOnDark;
    final primaryTextColor = isDark ? Colors.white : SasColors.ink;
    final mutedTextCol = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderCol),
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
                  color: isDark
                      ? SasColors.ink
                      : SasColors.ivory,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderCol),
                ),
                child: Center(
                  child: Icon(
                    Icons.verified_user_outlined,
                    color: isDark ? Colors.white : SasColors.ink,
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
                        fontWeight: FontWeight.w600,
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
              backgroundColor: isDark
                  ? SasColors.textSecondary
                  : SasColors.textOnDark,
              valueColor: const AlwaysStoppedAnimation<Color>(
                SasColors.copper,
              ),
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
                  textColor = isDark
                      ? SasColors.textOnDark
                      : SasColors.textSecondary;
                  fontWeight = FontWeight.w500;
                  leadingIcon = const Icon(
                    Icons.check_circle_rounded,
                    color: SasColors.success,
                    size: 18,
                  );
                } else if (isCurrent) {
                  textColor = primaryTextColor;
                  fontWeight = FontWeight.w600;
                  leadingIcon = const SizedBox(
                    width: 15,
                    height: 15,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        SasColors.copper,
                      ),
                    ),
                  );
                } else {
                  textColor = mutedTextCol;
                  fontWeight = FontWeight.w400;
                  leadingIcon = Icon(
                    Icons.radio_button_unchecked_rounded,
                    color: isDark
                        ? SasColors.textMuted
                        : SasColors.textOnDark,
                    size: 16,
                  );
                }

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: Center(child: leadingIcon),
                      ),
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
                            color: SasColors.copper,
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
