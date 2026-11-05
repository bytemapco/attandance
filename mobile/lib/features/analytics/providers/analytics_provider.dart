import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/core/error_messages.dart';
import 'package:smart_attendance_app/data/api/attendance_updates.dart';
import 'package:smart_attendance_app/data/repositories/student_insights_repository.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/domain/models/analytics.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/shared/load_state.dart';

class AnalyticsNotifier extends StateNotifier<LoadState<StudentAnalytics>> {
  final StudentInsightsRepository _repo;

  AnalyticsNotifier(this._repo) : super(const LoadState());

  Future<void> fetch() async {
    state = state.loading();
    try {
      state = state.loaded(await _repo.analytics());
    } catch (e) {
      state = state.failed(userMessage(e));
    }
  }

  void reset() => state = const LoadState();
}

final analyticsProvider =
    StateNotifierProvider<AnalyticsNotifier, LoadState<StudentAnalytics>>((
      ref,
    ) {
      final notifier = AnalyticsNotifier(
        ref.read(studentInsightsRepositoryProvider),
      );
      refreshOnAttendanceUpdate(ref, notifier.fetch);
      ref.listen(authProvider, (_, next) {
        if (next.status != AuthStatus.authenticated) notifier.reset();
      });
      return notifier;
    });
