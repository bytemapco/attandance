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

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBackground(
      child: SafeArea(
        child: RefreshIndicator(
          color: SasColors.osageOrange,
          backgroundColor: Theme.of(context).cardTheme.color ?? SasColors.bgSecondary,
          onRefresh: () async {
            await ref.read(sessionProvider.notifier).fetchSessions();
            await ref.read(historyProvider.notifier).fetch();
          },
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            children: [
              HomeWelcomeCard(user: user, pendingCount: pendingCount),
              const SizedBox(height: 14),
              if (historyState.data != null) ...[
                HomeAttendanceOverview(
                  overallPct: overallPct,
                  history: historyState.data!.history,
                  highestStreak:
                      calculateHighestStreak(historyState.data!.history),
                  onTapAnalytics: () => context.go('/analytics'),
                ),
                const SizedBox(height: 16),
              ] else if (overallPct > 0 && overallPct < 75) ...[
                HomeWarningBanner(
                  percentage: overallPct,
                  onTap: () => context.go('/analytics'),
                ),
                const SizedBox(height: 16),
              ],
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: SasColors.osageOrange.withValues(alpha: isDark ? 0.2 : 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.calendar_today_rounded,
                      color: SasColors.osageOrange,
                      size: 13,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Today's Classes",
                    style: TextStyle(
                      color: isDark ? SasColors.brilliance : SasColors.indianInk,
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (sessionState.sessions.isNotEmpty)
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: SasColors.osageOrange.withValues(alpha: isDark ? 0.22 : 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${sessionState.sessions.length}',
                        style: const TextStyle(
                          color: SasColors.osageOrange,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  const Spacer(),
                  Text(
                    DateTime.now().shortDate,
                    style: TextStyle(
                      color: isDark ? SasColors.maidenMist : SasColors.textMuted,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.1,
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
