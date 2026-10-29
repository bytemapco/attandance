import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/data/repositories/attendance_repository.dart';
import 'package:smart_attendance_app/features/attendance/providers/attendance_provider.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_hero_icon.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_metrics_card.dart';

class ResultScreen extends ConsumerWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vState = ref.watch(attendanceVerificationProvider);
    final result = vState.result;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ResultConfig config;
    if (vState.isError) {
      config = ResultConfig.error(vState.errorMessage);
    } else if (result is OfflineQueued) {
      config = ResultConfig.offline();
    } else if (result is OnlineResult) {
      final att = result.result;
      config = att.isPresent
          ? ResultConfig.present(att)
          : ResultConfig.flagged(att);
    } else {
      config = ResultConfig.processing();
    }

    final isFlagged = result is OnlineResult && result.result.isFlagged;
    final attId = (result is OnlineResult) ? result.result.id : '';

    void goHome() {
      context.go('/home');
      Future.microtask(
        () => ref.read(attendanceVerificationProvider.notifier).reset(),
      );
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) goHome();
      },
      child: Scaffold(
        backgroundColor: isDark
            ? SasColors.darkCanvas
            : const Color(0xFFF4F7FB),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 24,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(height: 16),
                    ResultHeroIcon(config: config),
                    const SizedBox(height: 18),
                    Text(
                      config.title,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        config.subtitle,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          color: isDark
                              ? const Color(0xFF94A3B8)
                              : const Color(0xFF64748B),
                          fontSize: 14,
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (config.scores != null) ...[
                      ResultMetricsCard(scores: config.scores!),
                    ],
                    const SizedBox(height: 28),
                    if (isFlagged) ...[
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            if (attId.isNotEmpty) {
                              context.push('/flagged/$attId');
                            } else {
                              context.push('/history');
                            }
                            Future.microtask(
                              () => ref
                                  .read(attendanceVerificationProvider.notifier)
                                  .reset(),
                            );
                          },
                          icon: const Icon(
                            Icons.rate_review_outlined,
                            size: 20,
                            color: Colors.white,
                          ),
                          label: Text(
                            'View details & add note',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF95721),
                            elevation: 0,
                            shadowColor: const Color(
                              0xFFF95721,
                            ).withValues(alpha: 0.35),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: goHome,
                        child: Text(
                          'Return to dashboard',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? const Color(0xFF94A3B8)
                                : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ] else
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          onPressed: goHome,
                          icon: const Icon(
                            Icons.check_rounded,
                            size: 20,
                            color: Colors.white,
                          ),
                          label: Text(
                            'Back to dashboard',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF95721),
                            elevation: 0,
                            shadowColor: const Color(
                              0xFFF95721,
                            ).withValues(alpha: 0.35),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
