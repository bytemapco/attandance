import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/widgets/review_score_row.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

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
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _progressAnim = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    Future.delayed(const Duration(milliseconds: 200), () {
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

    return GlassCard(
      borderColor: overallColor.withValues(alpha: 0.3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: overallColor.withValues(alpha: 0.12),
                  border: Border.all(color: overallColor.withValues(alpha: 0.3)),
                ),
                child: Icon(
                  isPresent ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                  color: overallColor,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AI Score Review',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: SasColors.textPrimary,
                      ),
                    ),
                    Text(
                      isPresent ? 'Looks good — ready to submit' : 'Low confidence — may be flagged',
                      style: TextStyle(
                        fontSize: 12,
                        color: overallColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: overallColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: overallColor.withValues(alpha: 0.3)),
                ),
                child: AnimatedBuilder(
                  animation: _progressAnim,
                  builder: (_, __) => Text(
                    '${(a.finalAiScore * 100 * _progressAnim.value).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontFamily: 'Inter',
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
          Container(height: 1, color: SasColors.glassBorder),
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
            label: 'Background',
            icon: Icons.location_city_rounded,
            score: a.backgroundScore,
            animation: _progressAnim,
            hint: _backgroundHint(a.backgroundScore),
          ),
          if (!isPresent) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: SasColors.warning.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: SasColors.warning.withValues(alpha: 0.25)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: SasColors.warning, size: 15),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Submitting will mark this as Flagged. Your teacher will review it.',
                      style: TextStyle(color: SasColors.warning, fontSize: 11, height: 1.4),
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

  String _faceHint(double score) {
    if (score >= 0.85) return 'Strong match';
    if (score >= kGoodScoreThreshold) return 'Good match';
    if (score >= 0.5) return 'Weak match';
    return 'Poor — try better lighting';
  }

  String _livenessHint(double score) {
    if (score >= 0.8) return 'Confirmed live';
    if (score >= 0.6) return 'Likely live';
    return 'Try better lighting';
  }

  String _backgroundHint(double score) {
    if (score >= kGoodScoreThreshold) return 'Classroom verified';
    return 'Unfamiliar background';
  }
}
