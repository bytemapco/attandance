import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

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
        (isDark ? SasColors.darkSurface : SasColors.ivory);
    final textColor = isSelected
        ? Colors.white
        : (unselectedTextColor ??
              (isDark ? SasColors.textOnDark : SasColors.textMuted));

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? SasColors.carbon : bg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: SasTypography.style(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ),
    );
  }
}
