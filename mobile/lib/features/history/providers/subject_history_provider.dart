import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/models/history.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';

/// One subject's classes, kept apart from the History tab so its filter is not disturbed.
final subjectHistoryProvider = StateNotifierProvider.autoDispose
    .family<HistoryNotifier, HistoryState, String>((ref, courseSectionId) {
      return HistoryNotifier(
        ref.read(studentInsightsRepositoryProvider),
        initialFilter: HistoryFilter(courseSectionId: courseSectionId),
      );
    });
