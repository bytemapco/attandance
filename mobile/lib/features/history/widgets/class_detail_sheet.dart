import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/ist_clock.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/shared/outcome_style.dart';
import 'package:smart_attendance_app/shared/widgets/app_button.dart';

Future<void> showClassDetailSheet(BuildContext context, HistoryEntry entry) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    constraints: const BoxConstraints(maxWidth: 480),
    builder: (_) => _ClassDetail(entry: entry),
  );
}

String _methodLabel(String? method) => switch (method) {
  'AI_BIOMETRIC' => 'Face check',
  'QR_CODE' => 'Class QR code',
  'SMART_PASS_OFFLINE' => 'Smart Pass',
  'MANUAL_REGISTER' || 'MANUAL_OVERRIDE' => 'Marked by your teacher',
  'SYSTEM_EXCUSED' => 'Approved leave',
  _ => 'Not marked',
};

class _ClassDetail extends StatelessWidget {
  final HistoryEntry entry;
  const _ClassDetail({required this.entry});

  @override
  Widget build(BuildContext context) {
    final color = outcomeColor(entry.outcome);
    final markedAt = entry.markedAt;
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: EdgeInsets.fromLTRB(
        20,
        8,
        20,
        20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(outcomeIcon(entry.outcome), color: color, size: 26),
              const SizedBox(width: 10),
              Text(
                entry.outcome.label,
                style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            entry.subjectName,
            style: TextStyle(
              color: SasColors.textPrimaryOf(context),
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 14),
          _Row(label: 'Date', value: DateFormat('EEEE, d MMMM yyyy').format(entry.date)),
          _Row(
            label: 'Time',
            value: '${formatClockTime(entry.startTime)} – ${formatClockTime(entry.endTime)}',
          ),
          _Row(label: 'Class', value: '${entry.subjectCode} · ${entry.classCode}'),
          _Row(label: 'How', value: _methodLabel(entry.method)),
          if (markedAt != null)
            _Row(label: 'Marked at', value: DateFormat('h:mm a').format(markedAt)),
          if (entry.remarks != null) _Row(label: 'Note', value: entry.remarks!),
          if (entry.studentNote != null)
            _Row(label: 'Your note', value: entry.studentNote!),
          if (entry.canAddNote && entry.attendanceId != null) ...[
            const SizedBox(height: 16),
            AppButton(
              label: entry.studentNote == null ? 'Review and add a note' : 'View review',
              icon: Icons.rate_review_rounded,
              isExpanded: true,
              onPressed: () {
                final route = '/flagged/${entry.attendanceId}';
                Navigator.of(context).pop();
                context.push(route);
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  const _Row({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Text(
              label,
              style: TextStyle(color: SasColors.textMutedOf(context), fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: SasColors.textPrimaryOf(context),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
