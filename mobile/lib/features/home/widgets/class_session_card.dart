import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/shared/widgets/pulsing_dot.dart';
import 'package:smart_attendance_app/shared/widgets/status_chip.dart';

class ClassSessionCard extends StatefulWidget {
  final ClassSession session;
  final bool isMarked;
  const ClassSessionCard({
    super.key,
    required this.session,
    required this.isMarked,
  });

  @override
  State<ClassSessionCard> createState() => _ClassSessionCardState();
}

class _ClassSessionCardState extends State<ClassSessionCard> {
  Timer? _countdownTimer;
  Duration? _remaining;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void didUpdateWidget(ClassSessionCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.session.sessionEndTime != oldWidget.session.sessionEndTime) {
      _countdownTimer?.cancel();
      _startCountdown();
    }
  }

  void _startCountdown() {
    final endTime = widget.session.sessionEndTime;
    if (endTime == null || !widget.session.isActive) return;
    _updateRemaining(endTime);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining(endTime));
  }

  void _updateRemaining(DateTime endTime) {
    final diff = endTime.difference(DateTime.now());
    if (mounted) setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    if (diff.isNegative) _countdownTimer?.cancel();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  bool get _isWindowClosed => _remaining != null && _remaining == Duration.zero;
  bool get _canMark => widget.session.isActive && widget.session.sessionId != null && !widget.isMarked && !_isWindowClosed;

  @override
  Widget build(BuildContext context) {
    final isActive = widget.session.isActive;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        borderColor: isActive
            ? (widget.isMarked ? SasColors.accentEmerald.withValues(alpha: 0.25) : SasColors.accentEmerald.withValues(alpha: 0.5))
            : null,
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isActive
                        ? (widget.isMarked ? SasColors.accentEmerald.withValues(alpha: 0.1) : SasColors.accentEmerald.withValues(alpha: 0.12))
                        : SasColors.bgCanvas,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    widget.isMarked ? Icons.check_circle_rounded : Icons.school_rounded,
                    size: 18,
                    color: isActive ? SasColors.accentEmerald : SasColors.textMuted,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.session.className,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: SasColors.textPrimary)),
                      const SizedBox(height: 1),
                      Text(widget.session.subject,
                          style: const TextStyle(color: SasColors.textSecondary, fontSize: 12)),
                      Text(widget.session.teacherName,
                          style: const TextStyle(color: SasColors.textMuted, fontSize: 11)),
                    ],
                  ),
                ),
                if (isActive) ...[
                  if (widget.isMarked)
                    const StatusChip(label: 'SUBMITTED', color: SasColors.accentEmerald)
                  else if (_isWindowClosed)
                    const StatusChip(label: 'CLOSED', color: SasColors.danger)
                  else
                    const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        PulsingDot(),
                        SizedBox(width: 5),
                        StatusChip(label: 'LIVE', color: SasColors.accentEmerald),
                      ],
                    ),
                ],
              ],
            ),
            if (isActive && _remaining != null && !_isWindowClosed && !widget.isMarked) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (_remaining!.inMinutes < 2 ? SasColors.warning : SasColors.accentEmerald).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.timer_outlined, size: 12, color: _remaining!.inMinutes < 2 ? SasColors.warning : SasColors.accentEmerald),
                    const SizedBox(width: 4),
                    Text(
                      '${_remaining!.inMinutes}:${(_remaining!.inSeconds % 60).toString().padLeft(2, '0')} remaining',
                      style: TextStyle(
                        color: _remaining!.inMinutes < 2 ? SasColors.warning : SasColors.accentEmerald,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (_canMark) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: GlassButton(
                      label: 'Smart Pass QR',
                      icon: Icons.qr_code_scanner_rounded,
                      height: 40,
                      fontSize: 12.5,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      onPressed: () => context.push('/smart-pass'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GlassButton(
                      label: 'Face Match',
                      variant: GlassButtonVariant.secondary,
                      icon: Icons.face_retouching_natural_rounded,
                      height: 40,
                      fontSize: 12.5,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      onPressed: () => context.push('/verify/${widget.session.sessionId}'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
