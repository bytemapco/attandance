import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/auth/widgets/splash_dots_loader.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _logoController;
  late final AnimationController _textController;
  late final AnimationController _dotsController;

  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _textFade;
  late final Animation<Offset> _textSlide;

  @override
  void initState() {
    super.initState();

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _dotsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _logoScale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.elasticOut),
    );
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    _textFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeOut));
    _textSlide = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _textController, curve: Curves.easeOutCubic),
        );

    _logoController.forward();
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _textController.forward();
    });

    Future.delayed(const Duration(milliseconds: 600), () async {
      try {
        await ref
            .read(authProvider.notifier)
            .checkInitialAuth()
            .timeout(const Duration(seconds: 10));
      } catch (_) {
        if (mounted) ref.read(authProvider.notifier).logout();
      }
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _dotsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F2035),
              SasColors.darkCanvas,
              Color(0xFF081218),
            ],
            stops: [0.0, 0.55, 1.0],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(flex: 3),

              // Logo mark
              ScaleTransition(
                scale: _logoScale,
                child: FadeTransition(
                  opacity: _logoFade,
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(26),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          SasColors.osageOrange,
                          SasColors.sunsetInItaly,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: SasColors.osageOrange.withValues(alpha: 0.45),
                          blurRadius: 32,
                          offset: const Offset(0, 8),
                        ),
                        BoxShadow(
                          color: SasColors.osageOrange.withValues(alpha: 0.15),
                          blurRadius: 64,
                          spreadRadius: 8,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      color: Colors.white,
                      size: 42,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Brand text
              SlideTransition(
                position: _textSlide,
                child: FadeTransition(
                  opacity: _textFade,
                  child: Column(
                    children: [
                      Text(
                        'Smart Attendance',
                        style: SasTypography.style(
                          color: SasColors.brilliance,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.8,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'AI-Powered Verification',
                        style: SasTypography.style(
                          color: SasColors.maidenMist,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const Spacer(flex: 3),

              // Animated dots loader
              FadeTransition(
                opacity: _textFade,
                child: SplashDotsLoader(controller: _dotsController),
              ),

              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }
}
