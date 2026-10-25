import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/core/extensions.dart';
import 'package:smart_attendance_app/data/local/pending_count_provider.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/class_session_card.dart';
import 'package:smart_attendance_app/features/home/widgets/home_attendance_overview.dart';
import 'package:smart_attendance_app/features/home/widgets/home_empty_classes.dart';
import 'package:smart_attendance_app/features/home/widgets/home_warning_banner.dart';
import 'package:smart_attendance_app/features/home/widgets/home_welcome_card.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/info_banner.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() {
      if (mounted) {
        ref.read(sessionProvider.notifier).startPolling();
        ref.read(historyProvider.notifier).fetch();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ref.read(sessionProvider.notifier).stopPolling();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      ref.read(sessionProvider.notifier).stopPolling();
    } else if (state == AppLifecycleState.resumed) {
      ref.read(sessionProvider.notifier).startPolling();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final sessionState = ref.watch(sessionProvider);
    final pendingCount = ref.watch(pendingCountProvider);
    final historyState = ref.watch(historyProvider);
    final rawPct = historyState.data?.overallAttendancePercentage ?? 0;
    final overallPct =
        (rawPct.isNaN || rawPct.isInfinite) ? 0.0 : rawPct.toDouble();

    return AnimatedBackground(
      child: SafeArea(
        child: RefreshIndicator(
          color: SasColors.accentEmerald,
          backgroundColor: SasColors.bgSecondary,
          onRefresh: () async {
            await ref.read(sessionProvider.notifier).fetchSessions();
            await ref.read(historyProvider.notifier).fetch();
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              HomeWelcomeCard(user: user, pendingCount: pendingCount),
              const SizedBox(height: 14),
              if (overallPct > 0 && overallPct < 75) ...[
                HomeWarningBanner(
                  percentage: overallPct,
                  onTap: () => context.go('/analytics'),
                ),
                const SizedBox(height: 10),
              ],
              if (historyState.data != null) ...[
                HomeAttendanceOverview(
                  overallPct: overallPct,
                  history: historyState.data!.history,
                  highestStreak:
                      calculateHighestStreak(historyState.data!.history),
                  onTapAnalytics: () => context.go('/analytics'),
                ),
                const SizedBox(height: 16),
              ],
              Row(
                children: [
                  const Icon(
                    Icons.schedule_rounded,
                    color: SasColors.textMuted,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    "Today's Schedule",
                    style: TextStyle(
                      color: SasColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (sessionState.sessions.isNotEmpty)
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: SasColors.accentEmerald.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${sessionState.sessions.length}',
                        style: const TextStyle(
                          color: SasColors.accentEmerald,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  const Spacer(),
                  Flexible(
                    child: Text(
                      DateTime.now().shortDate,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: SasColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (sessionState.errorMessage != null &&
                  sessionState.sessions.isEmpty)
                InfoBanner(
                  message: sessionState.errorMessage!,
                  severity: BannerSeverity.danger,
                  customIcon: Icons.wifi_off_rounded,
                  actionLabel: 'Retry',
                  onAction: () =>
                      ref.read(sessionProvider.notifier).fetchSessions(),
                )
              else if (sessionState.isLoading && sessionState.sessions.isEmpty)
                const ShimmerPlaceholder()
              else if (sessionState.sessions.isEmpty)
                const HomeEmptyClasses()
              else
                ...sessionState.sessions.map(
                  (session) => ClassSessionCard(
                    session: session,
                    isMarked: sessionState.markedSessionIds
                        .contains(session.sessionId),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
