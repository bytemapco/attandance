import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/data/repositories/attendance_repository.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_note_form.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_score_breakdown.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_troubleshoot_faq.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class FlaggedDetailScreen extends ConsumerStatefulWidget {
  final AttendanceHistoryItem? item;
  final String? attendanceId;
  const FlaggedDetailScreen({super.key, this.item, this.attendanceId});

  @override
  ConsumerState<FlaggedDetailScreen> createState() => _FlaggedDetailScreenState();
}

class _FlaggedDetailScreenState extends ConsumerState<FlaggedDetailScreen> {
  final _noteController = TextEditingController();
  bool _isSubmitting = false;
  bool _noteSubmitted = false;
  AttendanceHistoryItem? _item;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _item = widget.item;
    } else if (widget.attendanceId != null) {
      _loadItem();
    }
  }

  Future<void> _loadItem() async {
    setState(() => _isLoading = true);
    try {
      final res = await ref.read(attendanceRepositoryProvider).getHistory();
      final found = res.history.firstWhere((e) => e.attendanceId == widget.attendanceId);
      if (mounted) setState(() => _item = found);
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submitNote() async {
    final note = _noteController.text.trim();
    if (note.isEmpty || _item == null) return;
    setState(() => _isSubmitting = true);
    try {
      await ref.read(studentApiProvider).submitFlaggedNote(_item!.attendanceId, note);
      if (mounted) setState(() => _noteSubmitted = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: $e'), backgroundColor: SasColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        appBar: GlassAppBar(title: 'Flagged Record'),
        body: Center(child: CircularProgressIndicator(color: SasColors.accentEmerald)),
      );
    }

    if (_item == null) {
      return const Scaffold(
        appBar: GlassAppBar(title: 'Flagged Record'),
        body: Center(child: Text('Record not found', style: TextStyle(color: SasColors.textMuted))),
      );
    }

    final item = _item!;
    final col = statusColor(item.status);

    return Scaffold(
      appBar: const GlassAppBar(title: 'Flagged Record'),
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GlassCard(
                borderColor: col.withValues(alpha: 0.3),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: col.withValues(alpha: 0.1),
                      ),
                      child: Icon(
                        isPresentOrApproved(item.status) ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                        color: col,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(item.className, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    Text(item.subject, style: const TextStyle(color: SasColors.textMuted, fontSize: 13)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: col.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: col.withValues(alpha: 0.3)),
                      ),
                      child: Text(item.status, style: TextStyle(color: col, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      DateFormat('EEEE, MMM d · h:mm a').format(item.markedAt),
                      style: const TextStyle(color: SasColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              FlaggedScoreBreakdown(item: item),
              const SizedBox(height: 14),
              const FlaggedTroubleshootFaq(),
              if (item.teacherNote != null && item.teacherNote!.isNotEmpty) ...[
                const SizedBox(height: 14),
                GlassCard(
                  padding: const EdgeInsets.all(12),
                  borderColor: SasColors.info.withValues(alpha: 0.3),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.person_rounded, color: SasColors.info, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Teacher Note: ${item.teacherNote}',
                          style: const TextStyle(color: SasColors.textSecondary, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (item.status == 'Flagged') ...[
                const SizedBox(height: 14),
                FlaggedNoteForm(
                  controller: _noteController,
                  isSubmitting: _isSubmitting,
                  noteSubmitted: _noteSubmitted,
                  onSubmit: _submitNote,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
