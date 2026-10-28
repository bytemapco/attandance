import 'package:flutter/material.dart';
import 'package:smart_attendance_app/features/attendance/widgets/result_config.dart';

class ResultHeroIcon extends StatelessWidget {
  final ResultConfig config;

  const ResultHeroIcon({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryCol = config.color;

    return SizedBox(
      width: 140,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 104,
            height: 104,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryCol.withValues(alpha: isDark ? 0.14 : 0.10),
            ),
          ),
          Positioned(
            left: 20,
            top: 26,
            child: _buildDot(primaryCol, 6),
          ),
          Positioned(
            right: 18,
            bottom: 30,
            child: _buildDot(primaryCol, 8),
          ),
          Positioned(
            left: 34,
            bottom: 22,
            child: _buildDot(primaryCol, 4),
          ),
          Positioned(
            right: 32,
            top: 22,
            child: _buildDot(primaryCol, 5),
          ),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              border: Border.all(
                color: isDark ? const Color(0xFF334155) : primaryCol.withValues(alpha: 0.20),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: primaryCol.withValues(alpha: isDark ? 0.25 : 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Icon(
                config.icon,
                size: 28,
                color: primaryCol,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.22),
      ),
    );
  }
}
