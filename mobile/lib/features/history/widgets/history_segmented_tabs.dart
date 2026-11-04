import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/app/theme.dart';

enum HistoryViewMode { calendar, list }

/// Full-width segmented tab switcher with a physics-based sliding indicator pill.
class HistorySegmentedTabs extends StatelessWidget {
  final HistoryViewMode mode;
  final ValueChanged<HistoryViewMode> onChanged;
  final bool isDark;

  const HistorySegmentedTabs({
    super.key,
    required this.mode,
    required this.onChanged,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final isCalendar = mode == HistoryViewMode.calendar;

    return Container(
      height: 52,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.darkBorder : SasColors.textOnDark,
          width: 1.0,
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final tabWidth = constraints.maxWidth / 2;

          return Stack(
            children: [
              // Smooth sliding indicator pill
              AnimatedPositioned(
                duration: const Duration(milliseconds: 280),
                curve: Curves.fastOutSlowIn,
                left: isCalendar ? 0 : tabWidth,
                top: 0,
                bottom: 0,
                width: tabWidth,
                child: Container(
                  decoration: BoxDecoration(
                    color: SasColors.carbon,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

              // Interactive tab labels
              Row(
                children: [
                  _TabLabel(
                    label: 'Calendar',
                    icon: Icons.calendar_today_rounded,
                    selected: isCalendar,
                    isDark: isDark,
                    onTap: () {
                      if (!isCalendar) {
                        HapticFeedback.selectionClick();
                        onChanged(HistoryViewMode.calendar);
                      }
                    },
                  ),
                  _TabLabel(
                    label: 'List View',
                    icon: Icons.format_list_bulleted_rounded,
                    selected: !isCalendar,
                    isDark: isDark,
                    onTap: () {
                      if (isCalendar) {
                        HapticFeedback.selectionClick();
                        onChanged(HistoryViewMode.list);
                      }
                    },
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TabLabel extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  const _TabLabel({
    required this.label,
    required this.icon,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final inactiveColor = isDark
        ? SasColors.mutedOnDark
        : SasColors.textMuted;
    final targetColor = selected ? Colors.white : inactiveColor;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<Color?>(
                duration: const Duration(milliseconds: 220),
                tween: ColorTween(end: targetColor),
                builder: (context, color, _) {
                  return Icon(icon, size: 17, color: color);
                },
              ),
              const SizedBox(width: 8),
              TweenAnimationBuilder<Color?>(
                duration: const Duration(milliseconds: 220),
                tween: ColorTween(end: targetColor),
                builder: (context, color, _) {
                  return Text(
                    label,
                    style: SasTypography.style(
                      fontSize: 13.5,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w600,
                      color: color,
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
