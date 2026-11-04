import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/widgets/review_score_row.dart';
import 'package:smart_attendance_app/features/attendance/widgets/verification_ai_helpers.dart';

class VerificationAiReviewCard extends StatefulWidget {
  final AttendanceAnalysisResult analysis;
  final String? imagePath;

  const VerificationAiReviewCard({
    super.key,
    required this.analysis,
    this.imagePath,
  });

  @override
  State<VerificationAiReviewCard> createState() =>
      _VerificationAiReviewCardState();
}

class _VerificationAiReviewCardState extends State<VerificationAiReviewCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _progressAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _progressAnim = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.analysis;
    final overallColor = scoreColor(a.finalAiScore);
    final isPresent = a.wouldBePresent;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? SasColors.darkSurface : Colors.white;
    final borderCol = isDark
        ? SasColors.darkBorder
        : SasColors.border;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: overallColor.withValues(alpha: 0.12),
                ),
                child: Icon(
                  isPresent
                      ? Icons.check_circle_rounded
                      : Icons.warning_amber_rounded,
                  color: overallColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AI Identity & Liveness',
                      style: SasTypography.style(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: primaryTextColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isPresent
                          ? 'High Confidence — Ready to Submit'
                          : 'Borderline Score — Will Be Flagged',
                      style: SasTypography.style(
                        fontSize: 12,
                        color: overallColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: overallColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: AnimatedBuilder(
                  animation: _progressAnim,
                  builder: (_, __) => Text(
                    '${(a.finalAiScore * 100 * _progressAnim.value).toStringAsFixed(0)}%',
                    style: SasTypography.style(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: overallColor,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: borderCol, height: 1),
          const SizedBox(height: 14),
          ReviewScoreRow(
            label: 'Face Match',
            icon: Icons.face_rounded,
            score: a.faceScore,
            animation: _progressAnim,
            hint: getFaceHint(a.faceScore),
          ),
          const SizedBox(height: 10),
          ReviewScoreRow(
            label: 'Liveness',
            icon: Icons.visibility_rounded,
            score: a.livenessScore,
            animation: _progressAnim,
            hint: getLivenessHint(a.livenessScore),
          ),
          const SizedBox(height: 10),
          ReviewScoreRow(
            label: 'Environment',
            icon: Icons.location_city_rounded,
            score: a.backgroundScore,
            animation: _progressAnim,
            hint: getBackgroundHint(a.backgroundScore),
          ),
          if (!isPresent) ...[
            const SizedBox(height: 14),
            const VerificationFlaggedNotice(),
          ],
        ],
      ),
    );
  }
}
