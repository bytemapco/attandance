import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';

/// Filter pill button used on the History list tab.
class HistoryFilterPill<T> extends StatelessWidget {
  final String label;
  final T value;
  final T current;
  final Color? unselectedBgColor;
  final Color? unselectedTextColor;
  final VoidCallback onTap;

  const HistoryFilterPill({
    super.key,
    required this.label,
    required this.value,
    required this.current,
    this.unselectedBgColor,
    this.unselectedTextColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSelected = value == current;

    final bg =
        unselectedBgColor ??
        (isDark ? const Color(0xFF1E2838) : const Color(0xFFF1F5F9));
    final textColor = isSelected
        ? Colors.white
        : (unselectedTextColor ??
              (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B)));

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          gradient: isSelected
              ? const LinearGradient(
                  colors: [Color(0xFFF95721), Color(0xFFFF7A18)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                )
              : null,
          color: isSelected ? null : bg,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFFF95721).withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: SasTypography.style(
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
        ),
      ),
    );
  }
}
