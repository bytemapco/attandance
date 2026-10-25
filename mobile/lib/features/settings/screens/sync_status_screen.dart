import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';
import 'package:smart_attendance_app/data/local/offline_sync_service.dart';
import 'package:smart_attendance_app/features/settings/widgets/sync_queue_item.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_app_bar.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SyncStatusScreen extends ConsumerStatefulWidget {
  const SyncStatusScreen({super.key});

  @override
  ConsumerState<SyncStatusScreen> createState() => _SyncStatusScreenState();
}

class _SyncStatusScreenState extends ConsumerState<SyncStatusScreen> {
  bool _isSyncing = false;

  Future<void> _triggerSync() async {
    setState(() => _isSyncing = true);
    try {
      await ref.read(offlineSyncServiceProvider).syncQueue();
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hive = ref.watch(hiveServiceProvider);
    final queue = hive.getQueue();

    return Scaffold(
      appBar: const GlassAppBar(title: 'Offline Sync Status'),
      body: AnimatedBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GlassCard(
                borderColor: queue.isEmpty
                    ? SasColors.accentEmerald.withValues(alpha: 0.3)
                    : SasColors.info.withValues(alpha: 0.3),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: (queue.isEmpty ? SasColors.accentEmerald : SasColors.info)
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        queue.isEmpty ? Icons.cloud_done_rounded : Icons.cloud_sync_rounded,
                        color: queue.isEmpty ? SasColors.accentEmerald : SasColors.info,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            queue.isEmpty ? 'All Synced' : '${queue.length} Pending Records',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: SasColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            queue.isEmpty
                                ? 'No offline attendance pending'
                                : 'Awaiting network sync connection',
                            style: const TextStyle(color: SasColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    if (queue.isNotEmpty)
                      GlassButton(
                        label: 'Sync Now',
                        isLoading: _isSyncing,
                        icon: Icons.refresh_rounded,
                        onPressed: _isSyncing ? null : _triggerSync,
                      ),
                  ],
                ),
              ),
              if (queue.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text(
                  'Queued Submissions',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: SasColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                ...queue.map((p) => SyncQueueItem(payload: p)),
              ] else ...[
                const SizedBox(height: 48),
                Center(
                  child: Column(
                    children: [
                      Icon(Icons.cloud_done_rounded,
                          size: 48, color: SasColors.accentEmerald.withValues(alpha: 0.4)),
                      const SizedBox(height: 12),
                      const Text(
                        'Up to Date',
                        style: TextStyle(
                          color: SasColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'All check-ins are synchronized with the server.',
                        style: TextStyle(color: SasColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
