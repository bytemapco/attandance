import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/settings/providers/preferences_provider.dart';
import 'package:smart_attendance_app/features/settings/widgets/goals_info_cards.dart';
import 'package:smart_attendance_app/features/settings/widgets/goals_slider_card.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';

class GoalsScreen extends ConsumerWidget {
  const GoalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(preferencesProvider);
    final notifier = ref.read(preferencesProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    final targetVal = prefs.attendanceTarget;

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                children: [
                  // Top Bar with Back Chevron
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: Icon(
                          Icons.chevron_left_rounded,
                          color: primaryTextColor,
                          size: 28,
                        ),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 36,
                          minHeight: 36,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Goals & Targets',
                        style: SasTypography.style(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: primaryTextColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Title and Subtitle
                  Text(
                    'Attendance target',
                    style: SasTypography.style(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: primaryTextColor,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Choose the minimum attendance you want to maintain across all subjects.',
                    style: SasTypography.style(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w500,
                      color: subtitleColor,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 1. Minimum Attendance Slider Card
                  GoalsSliderCard(
                    targetVal: targetVal,
                    onChanged: (v) => notifier.setAttendanceTarget(v),
                  ),
                  const SizedBox(height: 14),

                  // 2. Info Callout Card
                  GoalsInfoCallout(isDark: isDark),
                  const SizedBox(height: 14),

                  // 3. Recommended Target Card (75%)
                  GoalsRecommendedCard(
                    isDark: isDark,
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      notifier.setAttendanceTarget(75.0);
                    },
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
