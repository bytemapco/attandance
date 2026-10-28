import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/widgets/review_score_row.dart';

class VerificationAiReviewCard extends StatefulWidget {
  final AttendanceAnalysisResult analysis;
  final String? imagePath;

  const VerificationAiReviewCard({super.key, required this.analysis, this.imagePath});

  @override
  State<VerificationAiReviewCard> createState() => _VerificationAiReviewCardState();
}

class _VerificationAiReviewCardState extends State<VerificationAiReviewCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _progressAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _progressAnim = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
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
    final borderCol = isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE3E9F1);
    final primaryTextColor = isDark ? SasColors.brilliance : const Color(0xFF0F172A);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
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
                  isPresent ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
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
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: primaryTextColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isPresent ? 'High Confidence — Ready to Submit' : 'Borderline Score — Will Be Flagged',
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
                      fontWeight: FontWeight.w800,
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
            hint: _faceHint(a.faceScore),
          ),
          const SizedBox(height: 10),
          ReviewScoreRow(
            label: 'Liveness',
            icon: Icons.visibility_rounded,
            score: a.livenessScore,
            animation: _progressAnim,
            hint: _livenessHint(a.livenessScore),
          ),
          const SizedBox(height: 10),
          ReviewScoreRow(
            label: 'Environment',
            icon: Icons.location_city_rounded,
            score: a.backgroundScore,
            animation: _progressAnim,
            hint: _backgroundHint(a.backgroundScore),
          ),
          if (!isPresent) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 16),
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
            ),
          ],
        ],
      ),
    );
  }

  String _faceHint(double s) => s >= 0.85 ? 'Strong match' : s >= kGoodScoreThreshold ? 'Good match' : s >= 0.5 ? 'Weak match' : 'Poor lighting';
  String _livenessHint(double s) => s >= 0.8 ? 'Confirmed live' : s >= 0.6 ? 'Likely live' : 'Check lighting';
  String _backgroundHint(double s) => s >= kGoodScoreThreshold ? 'Classroom verified' : 'Unfamiliar background';
}
