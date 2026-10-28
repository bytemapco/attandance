import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/data/repositories/attendance_repository.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_hero_card.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_note_form.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_score_breakdown.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_teacher_note_card.dart';
import 'package:smart_attendance_app/features/attendance/widgets/flagged_troubleshoot_faq.dart';

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
          SnackBar(content: Text('Submission failed: $e'), backgroundColor: const Color(0xFFF0445E)),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _handleBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _handleBack();
        },
        child: Scaffold(
          backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
          appBar: _buildAppBar(context, isDark),
          body: const Center(child: CircularProgressIndicator(color: Color(0xFFF95721))),
        ),
      );
    }

    if (_item == null) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _handleBack();
        },
        child: Scaffold(
          backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
          appBar: _buildAppBar(context, isDark),
          body: Center(
            child: Text(
              'Record not found',
              style: GoogleFonts.plusJakartaSans(color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
            ),
          ),
        ),
      );
    }

    final item = _item!;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
        appBar: _buildAppBar(context, isDark),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                children: [
                  FlaggedHeroCard(item: item),
                  const SizedBox(height: 16),
                  FlaggedScoreBreakdown(item: item),
                  const SizedBox(height: 16),
                  const FlaggedTroubleshootFaq(),
                  if (item.teacherNote != null && item.teacherNote!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    FlaggedTeacherNoteCard(note: item.teacherNote!),
                  ],
                  if (item.status == 'Flagged') ...[
                    const SizedBox(height: 16),
                    FlaggedNoteForm(
                      controller: _noteController,
                      isSubmitting: _isSubmitting,
                      noteSubmitted: _noteSubmitted,
                      onSubmit: _submitNote,
                    ),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context, bool isDark) {
    return AppBar(
      backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
      elevation: 0,
      centerTitle: true,
      leading: IconButton(
        icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: isDark ? Colors.white : const Color(0xFF0F172A)),
        onPressed: _handleBack,
      ),
      title: Text(
        'Flagged Record',
        style: GoogleFonts.plusJakartaSans(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white : const Color(0xFF0F172A),
        ),
      ),
    );
  }
}
