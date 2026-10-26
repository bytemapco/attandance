import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/repositories/attendance_repository.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_hero_icon.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_metrics_card.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

class ResultScreen extends ConsumerWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vState = ref.watch(attendanceVerificationProvider);
    final result = vState.result;

    ResultConfig config;
    if (vState.isError) {
      config = ResultConfig.error(vState.errorMessage);
    } else if (result is OfflineQueued) {
      config = ResultConfig.offline();
    } else if (result is OnlineResult) {
      final att = result.result;
      config = att.isPresent ? ResultConfig.present(att) : ResultConfig.flagged(att);
    } else {
      config = ResultConfig.processing();
    }

    final isFlagged = result is OnlineResult && result.result.isFlagged;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          context.go('/home');
          Future.microtask(() {
            ref.read(attendanceVerificationProvider.notifier).reset();
          });
        }
      },
      child: Scaffold(
        body: AnimatedBackground(
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Spacer(flex: 1),
                  ResultHeroIcon(config: config),
                  const SizedBox(height: 20),
                  Text(
                    config.title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: SasColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: config.color.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: config.color.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      config.subtitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: config.color,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(flex: 1),
                  if (config.scores != null) ResultMetricsCard(scores: config.scores!),
                  const Spacer(flex: 2),
                  if (isFlagged) ...[
                    GlassButton(
                      label: 'View Flagged Details',
                      isExpanded: true,
                      icon: Icons.info_outline_rounded,
                      onPressed: () {
                        context.go('/history');
                        Future.microtask(() {
                          ref.read(attendanceVerificationProvider.notifier).reset();
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                  ],
                  GlassButton(
                    label: 'Back to Dashboard',
                    isExpanded: true,
                    variant: isFlagged ? GlassButtonVariant.secondary : GlassButtonVariant.primary,
                    icon: Icons.home_rounded,
                    onPressed: () {
                      context.go('/home');
                      Future.microtask(() {
                        ref.read(attendanceVerificationProvider.notifier).reset();
                      });
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
