import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/features/leave/widgets/leave_category_selector.dart';
import 'package:smart_attendance_app/features/leave/widgets/leave_document_uploader.dart';
import 'package:smart_attendance_app/features/leave/widgets/leave_period_picker.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';
import 'package:smart_attendance_app/utils/logger.dart';

class LeaveRequestsScreen extends ConsumerStatefulWidget {
  const LeaveRequestsScreen({super.key});

  @override
  ConsumerState<LeaveRequestsScreen> createState() => _LeaveRequestsScreenState();
}

class _LeaveRequestsScreenState extends ConsumerState<LeaveRequestsScreen> {
  DateTime? _startDate;
  DateTime? _endDate;
  String _selectedReason = 'Medical';
  final _notesController = TextEditingController();
  final _picker = ImagePicker();
  File? _selectedDocument;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart
          ? (_startDate ?? DateTime.now())
          : (_endDate ?? _startDate ?? DateTime.now()),
      firstDate: isStart ? DateTime.now() : (_startDate ?? DateTime.now()),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(picked)) _endDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _pickDocument(ImageSource source) async {
    try {
      final file = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (file != null) {
        setState(() => _selectedDocument = File(file.path));
      }
    } catch (e) {
      AppLogger.error('Error picking document: $e');
    }
  }

  Future<void> _submit() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select leave start and end dates'),
          backgroundColor: SasColors.danger,
        ),
      );
      return;
    }

    final notes = _notesController.text.trim();
    final reason = notes.isEmpty ? '$_selectedReason Leave Request' : '$_selectedReason: $notes';

    setState(() => _isSubmitting = true);
    try {
      await ref.read(studentApiProvider).createLeaveRequest(
            startDate: _startDate!,
            endDate: _endDate!,
            reason: reason,
            documentPath: _selectedDocument?.path,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Leave request submitted successfully'),
            backgroundColor: SasColors.accentEmerald,
          ),
        );
        context.pop(true);
      }
    } catch (e) {
      AppLogger.error('Failed to submit leave: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit request. Please try again.'),
            backgroundColor: SasColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GlassAppBar(title: 'Request Leave'),
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              LeavePeriodPicker(
                startDate: _startDate,
                endDate: _endDate,
                onSelectStart: () => _pickDate(true),
                onSelectEnd: () => _pickDate(false),
              ),
              const SizedBox(height: 16),
              LeaveCategorySelector(
                selectedCategory: _selectedReason,
                onSelected: (cat) => setState(() => _selectedReason = cat),
              ),
              const SizedBox(height: 16),
              LeaveDocumentUploader(
                selectedDocument: _selectedDocument,
                onPick: _pickDocument,
                onClear: () => setState(() => _selectedDocument = null),
              ),
              const SizedBox(height: 16),
              const Text(
                'Reason Details & Notes',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: SasColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              GlassCard(
                padding: const EdgeInsets.all(12),
                child: TextField(
                  controller: _notesController,
                  maxLines: 3,
                  maxLength: 300,
                  style: const TextStyle(color: SasColors.textPrimary, fontSize: 13),
                  decoration: const InputDecoration(
                    hintText: 'Provide additional context for your instructor...',
                    hintStyle: TextStyle(color: SasColors.textMuted, fontSize: 12),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              GlassButton(
                label: 'Submit Leave Request',
                isExpanded: true,
                isLoading: _isSubmitting,
                icon: Icons.send_rounded,
                onPressed: _isSubmitting ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
