import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Clean enterprise bottom navigation bar adhering to Apple HIG.
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
    final unselectedColor = isDark ? SasColors.maidenMist : const Color(0xFF858997);

    const items = [
      ('Home', Icons.home_rounded),
      ('History', Icons.event_note_rounded),
      ('Analytics', Icons.insights_rounded),
      ('More', Icons.grid_view_rounded),
    ];

    return Container(
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkCanvas : SasColors.lightCanvas,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0x2EBAC0BE) : const Color(0x33BAC0BE),
            width: 0.8,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 8,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (i) {
              final selected = i == currentIndex;
              final itemColor = selected ? SasColors.osageOrange : unselectedColor;

              return Expanded(
                child: InkWell(
                  onTap: () {
                    if (i != currentIndex) {
                      HapticFeedback.selectionClick();
                    }
                    onTap(i);
                  },
                  splashColor: Colors.transparent,
                  highlightColor: Colors.transparent,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        items[i].$2,
                        size: 22,
                        color: itemColor,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        items[i].$1,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          color: itemColor,
                          letterSpacing: -0.1,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: selected ? SasColors.osageOrange : Colors.transparent,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
