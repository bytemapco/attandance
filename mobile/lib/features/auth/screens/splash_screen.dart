
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/shared/widgets/animated_background.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();

    Future.delayed(const Duration(milliseconds: 500), () async {
      try {
        await ref.read(authProvider.notifier).checkInitialAuth().timeout(
          const Duration(seconds: 10),
        );
      } catch (_) {
        if (mounted) {
          ref.read(authProvider.notifier).logout();
        }
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        SasColors.osageOrange,
                        SasColors.sunsetInItaly,
                      ],
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: SasColors.accentGlow,
                        blurRadius: 20,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    color: SasColors.brilliance,
                    size: 36,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Smart Attendance',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.5,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'AI-Powered Verification System',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: SasColors.maidenMist,
                        letterSpacing: 0.1,
                      ),
                ),
                const SizedBox(height: 40),
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      SasColors.osageOrange,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
