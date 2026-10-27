import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Floating card featuring the 3 core app highlights:
/// "Mark Attendance", "Track Progress", and "Stay Updated".
class AuthFeaturesCard extends StatelessWidget {
  const AuthFeaturesCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark
        ? SasColors.darkSurface.withValues(alpha: 0.95)
        : Colors.white.withValues(alpha: 0.96);
    final cardBorder = isDark
        ? const Color(0x2EFFFFFF)
        : const Color(0x18000000);
    final labelColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF1E293B);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.07),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _FeatureItem(
              icon: Icons.calendar_month_rounded,
              iconColor: const Color(0xFFF95721),
              bgColor: isDark
                  ? const Color(0xFFF95721).withValues(alpha: 0.18)
                  : const Color(0xFFFFF1EB),
              label: 'Mark\nAttendance',
              textColor: labelColor,
            ),
          ),
          Container(
            width: 1,
            height: 28,
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0x0F000000),
          ),
          Expanded(
            child: _FeatureItem(
              icon: Icons.bar_chart_rounded,
              iconColor: const Color(0xFF8B5CF6),
              bgColor: isDark
                  ? const Color(0xFF8B5CF6).withValues(alpha: 0.18)
                  : const Color(0xFFF3E8FF),
              label: 'Track\nProgress',
              textColor: labelColor,
            ),
          ),
          Container(
            width: 1,
            height: 28,
            color: isDark ? const Color(0x1FFFFFFF) : const Color(0x0F000000),
          ),
          Expanded(
            child: _FeatureItem(
              icon: Icons.school_rounded,
              iconColor: const Color(0xFF10B981),
              bgColor: isDark
                  ? const Color(0xFF10B981).withValues(alpha: 0.18)
                  : const Color(0xFFECFDF5),
              label: 'Stay\nUpdated',
              textColor: labelColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureItem extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final Color textColor;

  const _FeatureItem({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.textColor,
  });

  @override
  State<_FeatureItem> createState() => _FeatureItemState();
}

class _FeatureItemState extends State<_FeatureItem> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.94 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOutCubic,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: widget.bgColor,
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(widget.icon, color: widget.iconColor, size: 18),
            ),
            const SizedBox(height: 4),
            Text(
              widget.label,
              textAlign: TextAlign.center,
              style: SasTypography.style(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: widget.textColor,
                height: 1.15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
