import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/class_session_actions.dart';
import 'package:smart_attendance_app/features/home/widgets/class_session_header.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

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

  String get _courseCode {
    final name = widget.session.className;
    if (name.contains(':')) return name.split(':').first.trim();
    return '';
  }

  String get _courseTitle {
    final name = widget.session.className;
    if (name.contains(':')) {
      final titlePart = name.split(':').sublist(1).join(':').trim();
      if (titlePart.isNotEmpty) return titlePart;
    }
    if (widget.session.subject.isNotEmpty) return widget.session.subject;
    return name;
  }

  @override
  Widget build(BuildContext context) {
    final isActive = widget.session.isActive;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        borderColor: isActive
            ? (widget.isMarked
                ? SasColors.accentEmerald.withValues(alpha: 0.3)
                : SasColors.osageOrange.withValues(alpha: 0.45))
            : (isDark ? const Color(0x1FBAC0BE) : null),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClassSessionHeader(
              courseCode: _courseCode,
              isActive: isActive,
              isMarked: widget.isMarked,
              isWindowClosed: _isWindowClosed,
            ),
            const SizedBox(height: 10),
            Text(
              _courseTitle,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16.5,
                letterSpacing: -0.4,
                color: isDark ? SasColors.brilliance : SasColors.indianInk,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(3.5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0x14FFFFFF) : const Color(0x0A000000),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.person_rounded,
                    size: 12,
                    color: isDark ? SasColors.maidenMist : SasColors.textMuted,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  widget.session.teacherName,
                  style: TextStyle(
                    color: isDark ? SasColors.maidenMist : SasColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (isActive && _remaining != null && !_isWindowClosed && !widget.isMarked) ...[
                  const Spacer(),
                  Icon(
                    Icons.timer_outlined,
                    size: 13,
                    color: _remaining!.inMinutes < 2 ? SasColors.danger : SasColors.osageOrange,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${_remaining!.inMinutes}:${(_remaining!.inSeconds % 60).toString().padLeft(2, '0')} left',
                    style: TextStyle(
                      color: _remaining!.inMinutes < 2 ? SasColors.danger : SasColors.osageOrange,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ],
            ),
            if (widget.isMarked || _canMark) ...[
              const SizedBox(height: 12),
              ClassSessionActions(
                isMarked: widget.isMarked,
                canMark: _canMark,
                onSmartPass: () => context.push('/smart-pass'),
                onFaceMatch: () => context.push('/verify/${widget.session.sessionId}'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
