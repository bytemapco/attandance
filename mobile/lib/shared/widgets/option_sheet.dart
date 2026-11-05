import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// The student's pick from [showOptionSheet]. [value] is null for the "all" choice, so a null
/// result from the sheet itself still means "dismissed without choosing".
class Choice<T> {
  final T? value;
  const Choice(this.value);
}

class SheetOption<T> {
  final T? value;
  final String label;
  final String? detail;

  const SheetOption({required this.value, required this.label, this.detail});
}

Future<Choice<T>?> showOptionSheet<T>(
  BuildContext context, {
  required String title,
  required List<SheetOption<T>> options,
  required T? selected,
}) {
  return showModalBottomSheet<Choice<T>>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    constraints: const BoxConstraints(maxWidth: 480),
    builder: (sheetContext) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Text(
              title,
              style: TextStyle(
                color: SasColors.textPrimaryOf(sheetContext),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              physics: const ClampingScrollPhysics(),
              children: [
                for (final option in options)
                  ListTile(
                    title: Text(option.label),
                    subtitle: option.detail == null ? null : Text(option.detail!),
                    trailing: option.value == selected
                        ? const Icon(Icons.check_rounded, color: SasColors.copperStrong)
                        : null,
                    onTap: () => Navigator.of(sheetContext).pop(Choice<T>(option.value)),
                  ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
