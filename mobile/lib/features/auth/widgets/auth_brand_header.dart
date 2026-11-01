import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Brand header with the SAHAJ logo and an optional circular back button.
class AuthBrandHeader extends StatelessWidget {
  final VoidCallback? onBackPressed;
  final bool isLightBackground;

  const AuthBrandHeader({
    super.key,
    this.onBackPressed,
    this.isLightBackground = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final smartTextColor = isLightBackground
        ? (isDark ? SasColors.brilliance : const Color(0xFF0F172A))
        : SasColors.brilliance;

    final logo = Expanded(
      child: Row(
        children: [
          SizedBox(
            width: 36,
            height: 36,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(9),
              child: Image.asset(
                'assets/images/sahaj_app_icon.png',
                semanticLabel: 'SAHAJ',
                width: 36,
                height: 36,
                cacheWidth: 72,
                cacheHeight: 72,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'SAHAJ',
                  style: SasTypography.style(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.5,
                    color: smartTextColor,
                    height: 1.0,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Campus, made effortless',
                  style: SasTypography.style(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.3,
                    color: isDark
                        ? SasColors.maidenMist
                        : const Color(0xFF526F78),
                    height: 1.0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (onBackPressed == null) {
      return Row(children: [logo]);
    }

    return Row(
      children: [
        _BackButton(
          onPressed: onBackPressed!,
          isDark: isDark,
          color: smartTextColor,
        ),
        const SizedBox(width: 12),
        logo,
      ],
    );
  }
}

class _BackButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isDark;
  final Color color;

  const _BackButton({
    required this.onPressed,
    required this.isDark,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final background = isDark ? SasColors.darkSurface : Colors.white;
    final border = isDark ? const Color(0x1EFFFFFF) : const Color(0x12000000);

    return Tooltip(
      message: 'Back',
      child: InkWell(
        onTap: onPressed,
        customBorder: const CircleBorder(),
        child: Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: background,
              shape: BoxShape.circle,
              border: Border.all(color: border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(Icons.chevron_left_rounded, color: color, size: 24),
          ),
        ),
      ),
    );
  }
}
