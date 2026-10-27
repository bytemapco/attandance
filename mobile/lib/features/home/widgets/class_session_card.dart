import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/class_session_actions.dart';
import 'package:smart_attendance_app/features/home/widgets/class_session_header.dart';
import 'package:smart_attendance_app/features/home/widgets/class_session_info_row.dart';
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
    _countdownTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _updateRemaining(endTime),
    );
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

  bool get _isWindowClosed =>
      _remaining != null && _remaining == Duration.zero;
  bool get _canMark =>
      widget.session.isActive &&
      widget.session.sessionId != null &&
      !widget.isMarked &&
      !_isWindowClosed;

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

  bool get _isUrgent =>
      _remaining != null &&
      _remaining!.inMinutes < 2 &&
      !_isWindowClosed &&
      !widget.isMarked;

  @override
  Widget build(BuildContext context) {
    final isActive = widget.session.isActive;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color? borderColor;
    if (isActive) {
      if (widget.isMarked) {
        borderColor = SasColors.accentEmerald.withValues(alpha: 0.35);
      } else if (_isUrgent) {
        borderColor = SasColors.danger.withValues(alpha: 0.45);
      } else {
        borderColor = SasColors.osageOrange.withValues(alpha: 0.40);
      }
    } else {
      borderColor = isDark ? const Color(0x14FFFFFF) : null;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        borderColor: borderColor,
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

            // Course title
            Text(
              _courseTitle,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                letterSpacing: -0.4,
                color: isDark ? SasColors.brilliance : SasColors.indianInk,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 8),

            // Teacher + countdown row
            ClassSessionInfoRow(
              teacherName: widget.session.teacherName,
              isActive: isActive,
              isMarked: widget.isMarked,
              isWindowClosed: _isWindowClosed,
              isUrgent: _isUrgent,
              remaining: _remaining,
              isDark: isDark,
            ),

            if (widget.isMarked || _canMark) ...[
              const SizedBox(height: 14),
              ClassSessionActions(
                isMarked: widget.isMarked,
                canMark: _canMark,
                onSmartPass: () => context.push('/smart-pass'),
                onFaceMatch: () =>
                    context.push('/verify/${widget.session.sessionId}'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
