import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/history/providers/history_provider.dart';
import 'package:smart_attendance_app/features/home/providers/session_provider.dart';
import 'package:smart_attendance_app/features/home/widgets/home_compliance_card.dart';
import 'package:smart_attendance_app/features/home/widgets/home_header_crest.dart';
import 'package:smart_attendance_app/features/home/widgets/home_modern_header.dart';
import 'package:smart_attendance_app/features/home/widgets/home_motivational_banner.dart';
import 'package:smart_attendance_app/features/home/widgets/home_stat_pills_row.dart';
import 'package:smart_attendance_app/features/home/widgets/home_today_classes_card.dart';
import 'package:smart_attendance_app/shared/widgets/smart_pull_to_refresh.dart';

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
    final historyState = ref.watch(historyProvider);
    final rawPct = historyState.data?.overallAttendancePercentage ?? 0;
    final overallPct =
        (rawPct.isNaN || rawPct.isInfinite) ? 0.0 : rawPct.toDouble();

    final historyList = historyState.data?.history ?? [];
    final streakDays = calculateStreak(historyList);
    final classesThisWeek = computeWeekPresent(historyList);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return Scaffold(
      backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Campus header photo fading into the canvas
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 240,
            child: IgnorePointer(
              child: ShaderMask(
                shaderCallback: (rect) {
                  return LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: isDark ? 0.45 : 0.85),
                      Colors.transparent,
                    ],
                    stops: const [0.50, 1.0],
                  ).createShader(rect);
                },
                blendMode: BlendMode.dstIn,
                child: Image.asset(
                  'assets/images/campus_header.png',
                  fit: BoxFit.cover,
                  alignment: const Alignment(0.35, 0.0),
                ),
              ),
            ),
          ),

          // Top-left curved organic orange crest
          const Positioned(
            top: 0,
            left: 0,
            width: 150,
            height: 95,
            child: HomeHeaderCrest(),
          ),

          SafeArea(
            child: SmartPullToRefresh(
              onRefresh: () async {
                await ref.read(sessionProvider.notifier).fetchSessions();
                await ref.read(historyProvider.notifier).fetch();
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Modern Student Header (Avatar, Hello, Institute, Bell)
                  HomeModernHeader(
                    user: user,
                    unreadCount: unreadCount,
                    onNotificationTap: () => context.push('/notifications'),
                  ),
                  const SizedBox(height: 16),

                  // Hero Term Compliance Gradient Card (0% with Circular Gauge)
                  HomeComplianceCard(
                    percentage: overallPct,
                    onTap: () => context.go('/analytics'),
                  ),
                  const SizedBox(height: 14),

                  // Streak & Classes this week pills
                  HomeStatPillsRow(
                    streakDays: streakDays,
                    classesThisWeek: classesThisWeek > 0 ? classesThisWeek : 1,
                    onTapStreak: () => context.go('/history'),
                    onTapClasses: () => context.go('/history'),
                  ),
                  const SizedBox(height: 14),

                  // Today's Classes Card with in-card action buttons
                  HomeTodayClassesCard(
                    sessions: sessionState.sessions,
                    onViewAll: () => context.go('/history'),
                    onSmartPass: () => context.push('/smart-pass'),
                    onFaceMatch: () {
                      final activeSessionId = sessionState.sessions
                          .where((s) => s.isActive && s.sessionId != null)
                          .firstOrNull
                          ?.sessionId;
                      if (activeSessionId != null) {
                        context.push('/verify/$activeSessionId');
                      } else {
                        context.push('/smart-pass');
                      }
                    },
                  ),
                  const SizedBox(height: 14),

                  // Bottom Motivational Trophy Banner
                  const HomeMotivationalBanner(),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
