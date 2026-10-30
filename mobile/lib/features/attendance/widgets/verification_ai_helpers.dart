import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';

class VerificationFlaggedNotice extends StatelessWidget {
  const VerificationFlaggedNotice({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: Color(0xFFD97706),
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Submitting will mark this session as Flagged for teacher review.',
              style: SasTypography.style(
                color: const Color(0xFF92400E),
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String getFaceHint(double s) => s >= 0.85
    ? 'Strong match'
    : s >= kGoodScoreThreshold
    ? 'Good match'
    : s >= 0.5
    ? 'Weak match'
    : 'Poor lighting';

String getLivenessHint(double s) => s >= 0.8
    ? 'Confirmed live'
    : s >= 0.6
    ? 'Likely live'
    : 'Check lighting';

String getBackgroundHint(double s) =>
    s >= kGoodScoreThreshold ? 'Classroom verified' : 'Unfamiliar background';
