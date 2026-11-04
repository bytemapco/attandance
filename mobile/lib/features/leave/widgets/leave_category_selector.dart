import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

class LeaveCategorySelector extends StatelessWidget {
  final String selectedCategory;
  final ValueChanged<String> onSelected;

  static const List<String> categories = [
    'Medical',
    'Family Emergency',
    'Personal',
    'Academic',
    'Other',
  ];

  const LeaveCategorySelector({
    super.key,
    required this.selectedCategory,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textSecondary = SasColors.textSecondaryOf(context);
    final chipBg = isDark ? SasColors.darkSurface : SasColors.bgSecondary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Leave Category',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: categories.map((cat) {
            final isSelected = selectedCategory == cat;
            return ChoiceChip(
              label: Text(cat),
              selected: isSelected,
              onSelected: (_) => onSelected(cat),
              selectedColor: SasColors.success.withValues(alpha: 0.15),
              backgroundColor: chipBg,
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? SasColors.success : textSecondary,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(
                  color: isSelected
                      ? SasColors.success
                      : (isDark
                            ? SasColors.darkBorder
                            : SasColors.textOnDark),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
