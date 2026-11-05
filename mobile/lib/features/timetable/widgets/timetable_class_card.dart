import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/domain/enums/attendance_outcome.dart';
import 'package:smart_attendance_app/domain/models/timetable.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';

enum ClassFocus { now, next }

class TimetableClassCard extends StatelessWidget {
  final TimetableEntry entry;
  final DateTime clock;
  final ClassFocus? focus;
  final VoidCallback? onMark;

  const TimetableClassCard({
    super.key,
    required this.entry,
    required this.clock,
    this.focus,
    this.onMark,
  });

  @override
  Widget build(BuildContext context) {
    final phase = entry.phaseAt(clock);
    final muted = SasColors.textMutedOf(context);
    final cancelled = phase == ClassPhase.cancelled;
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      borderColor: focus == null ? null : SasColors.copper,
      child: Opacity(
        opacity: cancelled ? 0.75 : 1,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _TimeColumn(entry: entry),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (focus != null) _FocusLabel(focus: focus!),
                  Text(
                    entry.subjectName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: SasColors.textPrimaryOf(context),
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      decoration: cancelled ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _detail(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: muted, fontSize: 12.5),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _Tag(label: _phaseLabel(phase), color: _phaseColor(phase)),
                      if (entry.isSubstitute)
                        const _Tag(label: 'Substitute', color: SasColors.info),
                      if (entry.isExtra)
                        const _Tag(label: 'Extra class', color: SasColors.info),
                    ],
                  ),
                  if (cancelled && entry.cancellationReason != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      entry.cancellationReason!,
                      style: TextStyle(color: muted, fontSize: 12),
                    ),
                  ],
                  if (phase == ClassPhase.openForAttendance && onMark != null) ...[
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Mark attendance',
                      icon: Icons.how_to_reg_rounded,
                      isExpanded: true,
                      onPressed: onMark,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _detail() => [
    entry.subjectCode,
    if (entry.teacherName != null) entry.teacherName!,
    if (entry.classroomName != null) entry.classroomName!,
  ].join(' · ');

  String _phaseLabel(ClassPhase phase) => switch (phase) {
    ClassPhase.upcoming => 'Upcoming',
    ClassPhase.inProgress => 'In progress',
    ClassPhase.openForAttendance => 'Attendance open',
    ClassPhase.marked => entry.outcome!.label,
    ClassPhase.ended =>
      entry.outcome == AttendanceOutcome.absent ? 'Absent' : 'Ended',
    ClassPhase.cancelled => 'Cancelled',
  };

  Color _phaseColor(ClassPhase phase) => switch (phase) {
    ClassPhase.upcoming || ClassPhase.ended => SasColors.textMuted,
    ClassPhase.inProgress => SasColors.info,
    ClassPhase.openForAttendance => SasColors.copperStrong,
    ClassPhase.marked => outcomeColor(entry.outcome!),
    ClassPhase.cancelled => SasColors.danger,
  };
}

class _TimeColumn extends StatelessWidget {
  final TimetableEntry entry;
  const _TimeColumn({required this.entry});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 66,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            formatClockTime(entry.startTime),
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            formatClockTime(entry.endTime),
            style: TextStyle(color: SasColors.textMutedOf(context), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _FocusLabel extends StatelessWidget {
  final ClassFocus focus;
  const _FocusLabel({required this.focus});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        focus == ClassFocus.now ? 'HAPPENING NOW' : 'UP NEXT',
        style: const TextStyle(
          color: SasColors.copperStrong,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  final Color color;
  const _Tag({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: SasRadius.xlAll,
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
