import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Premium bottom navigation with animated amber pill indicator
/// and filled/outlined icon state transitions.
class GlassBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const GlassBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    const items = [
      _NavItem(
        label: 'Home',
        filledIcon: Icons.home_rounded,
        outlinedIcon: Icons.home_outlined,
      ),
      _NavItem(
        label: 'History',
        filledIcon: Icons.event_note_rounded,
        outlinedIcon: Icons.event_note_outlined,
      ),
      _NavItem(
        label: 'Analytics',
        filledIcon: Icons.bar_chart_rounded,
        outlinedIcon: Icons.bar_chart_outlined,
      ),
      _NavItem(
        label: 'More',
        filledIcon: Icons.grid_view_rounded,
        outlinedIcon: Icons.grid_view_outlined,
      ),
    ];

    final bgColor = isDark ? SasColors.darkCanvas : SasColors.lightSurface;
    final borderColor = isDark
        ? const Color(0x1EFFFFFF)
        : const Color(0x14000000);

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        border: Border(top: BorderSide(color: borderColor, width: 0.5)),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            children: List.generate(items.length, (i) {
              final selected = i == currentIndex;
              return _NavTabItem(
                item: items[i],
                selected: selected,
                isDark: isDark,
                onTap: () {
                  if (i != currentIndex) {
                    HapticFeedback.selectionClick();
                  }
                  onTap(i);
                },
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData filledIcon;
  final IconData outlinedIcon;

  const _NavItem({
    required this.label,
    required this.filledIcon,
    required this.outlinedIcon,
  });
}

class _NavTabItem extends StatelessWidget {
  final _NavItem item;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  const _NavTabItem({
    required this.item,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = SasColors.osageOrange;
    final inactiveColor = isDark
        ? const Color(0xFFCBD5E1)
        : const Color(0xFF475569);

    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: '${item.label} tab',
        hint: 'Navigates to ${item.label}',
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: SizedBox(
            height: 52,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
              // Animated pill behind icon
              AnimatedContainer(
                duration: SasDurations.spring,
                curve: Curves.easeOutCubic,
                width: selected ? 56 : 32,
                height: 32,
                decoration: BoxDecoration(
                  color: selected
                      ? SasColors.osageOrange.withValues(
                          alpha: isDark ? 0.18 : 0.12,
                        )
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: AnimatedSwitcher(
                    duration: SasDurations.normal,
                    switchInCurve: Curves.easeOut,
                    switchOutCurve: Curves.easeIn,
                    transitionBuilder: (child, animation) => ScaleTransition(
                      scale: animation,
                      child: FadeTransition(opacity: animation, child: child),
                    ),
                    child: Icon(
                      selected ? item.filledIcon : item.outlinedIcon,
                      key: ValueKey(selected),
                      size: 22,
                      color: selected ? activeColor : inactiveColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 2),
              AnimatedDefaultTextStyle(
                duration: SasDurations.normal,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                  color: selected ? activeColor : inactiveColor,
                  letterSpacing: selected ? -0.1 : 0,
                ),
                child: Text(item.label),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
}
