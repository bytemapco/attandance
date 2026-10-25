import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Clean enterprise bottom navigation bar.
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
    const items = [
      ('Home', Icons.home_rounded),
      ('History', Icons.event_note_rounded),
      ('Analytics', Icons.insights_rounded),
      ('More', Icons.grid_view_rounded),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: SasColors.bgSecondary,
        border: Border(
          top: BorderSide(color: SasColors.glassBorder),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 6,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (i) {
              final selected = i == currentIndex;
              return Expanded(
                child: InkWell(
                  onTap: () {
                    if (i != currentIndex) {
                      HapticFeedback.selectionClick();
                    }
                    onTap(i);
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: selected
                        ? BoxDecoration(
                            color: SasColors.accentEmerald
                                .withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                          )
                        : null,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          items[i].$2,
                          size: 20,
                          color: selected
                              ? SasColors.accentEmerald
                              : SasColors.textMuted,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          items[i].$1,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight:
                                selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected
                                ? SasColors.accentEmerald
                                : SasColors.textMuted,
                          ),
                        ),
                      ],
                    ),
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
