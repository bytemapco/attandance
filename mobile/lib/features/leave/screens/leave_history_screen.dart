import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/api/student_api.dart';
import 'package:smart_attendance_app/domain/models/leave_request.dart';
import 'package:smart_attendance_app/features/leave/widgets/leave_history_stats.dart';
import 'package:smart_attendance_app/features/leave/widgets/leave_history_tile.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

final leaveHistoryProvider = FutureProvider.autoDispose<List<LeaveRequest>>((ref) async {
  final response = await ref.read(studentApiProvider).getMyLeaves();
  final listResponse = LeaveRequestListResponse.fromJson(response);
  return listResponse.leaves;
});

class LeaveHistoryScreen extends ConsumerWidget {
  const LeaveHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(leaveHistoryProvider);

    return Scaffold(
      appBar: const GlassAppBar(title: 'Leave History'),
      body: AnimatedBackground(
        child: SafeArea(
          child: historyAsync.when(
            data: (leaves) => leaves.isEmpty ? _buildEmpty() : _buildList(leaves),
            loading: () => const Center(child: CircularProgressIndicator(color: SasColors.accentEmerald)),
            error: (err, _) => _buildError(err.toString()),
          ),
        ),
      ),
    );
  }

  Widget _buildList(List<LeaveRequest> leaves) {
    final sorted = [...leaves]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        LeaveHistoryStats(leaves: leaves),
        const SizedBox(height: 16),
        const Text(
          'Submitted Requests',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        ...sorted.map((leave) => LeaveHistoryTile(leave: leave)),
      ],
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: GlassCard(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.event_busy_rounded, size: 48, color: SasColors.textMuted),
              SizedBox(height: 12),
              Text(
                'No Leave History',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: SasColors.textPrimary),
              ),
              SizedBox(height: 6),
              Text(
                'You have not submitted any leave requests yet.',
                textAlign: TextAlign.center,
                style: TextStyle(color: SasColors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: GlassCard(
          borderColor: SasColors.danger.withValues(alpha: 0.3),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 40, color: SasColors.danger),
              const SizedBox(height: 10),
              const Text(
                'Failed to Load History',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: SasColors.danger),
              ),
              const SizedBox(height: 6),
              Text(
                error,
                textAlign: TextAlign.center,
                style: const TextStyle(color: SasColors.textMuted, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
