import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

class AuthHeroSection extends StatelessWidget {
  const AuthHeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/images/auth_hero.jpg',
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _buildFallback(),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.65),
                Colors.black.withValues(alpha: 0.15),
                SasColors.darkCanvas.withValues(alpha: 0.70),
                SasColors.darkCanvas.withValues(alpha: 0.98),
              ],
              stops: const [0.0, 0.35, 0.70, 1.0],
            ),
          ),
        ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: SasColors.osageOrange,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: const [
                        BoxShadow(
                          color: SasColors.accentGlow,
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      color: SasColors.brilliance,
                      size: 19,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'SMART ATTENDANCE',
                    style: SasTypography.style(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.0,
                      color: SasColors.brilliance,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            SasColors.darkCanvas,
            SasColors.darkSurface,
            SasColors.indianInk,
          ],
        ),
      ),
    );
  }
}
