import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/history/widgets/subject_detail_summary.dart';
import 'package:smart_attendance_app/features/history/widgets/subject_session_row.dart';
import 'package:smart_attendance_app/features/settings/providers/preferences_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SubjectDetailScreen extends ConsumerWidget {
  final String classId;
  const SubjectDetailScreen({super.key, required this.classId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hState = ref.watch(historyProvider);
    final prefs = ref.watch(preferencesProvider);
    final target = prefs.attendanceTarget;

    final allItems = hState.data?.history ?? [];
    final items = allItems.where((h) => h.classId == classId).toList()
      ..sort((a, b) => b.markedAt.compareTo(a.markedAt));

    final subjectName = items.isNotEmpty ? items.first.subject : 'Subject Details';
    final className = items.isNotEmpty ? items.first.className : '';

    return Scaffold(
      appBar: GlassAppBar(title: subjectName),
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SubjectDetailSummary(
                subjectName: subjectName,
                className: className,
                items: items,
                target: target,
              ),
              const SizedBox(height: 16),
              if (items.isEmpty)
                const GlassCard(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'No attendance records found for this course.',
                        style: TextStyle(color: SasColors.textMuted, fontSize: 13),
                      ),
                    ),
                  ),
                )
              else ...[
                const Text(
                  'Session Timeline',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: SasColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                ...items.map((item) => SubjectSessionRow(item: item)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
