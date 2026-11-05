import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Shown above a screen that is displaying the phone's saved copy because the server was unreachable.
class SavedDataNotice extends StatelessWidget {
  final DateTime savedAt;

  const SavedDataNotice({super.key, required this.savedAt});

  @override
  Widget build(BuildContext context) {
    final sameDay = DateUtils.isSameDay(savedAt, DateTime.now());
    final when = DateFormat(sameDay ? 'h:mm a' : 'd MMM, h:mm a').format(savedAt);
    return Semantics(
      container: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: SasColors.info.withValues(alpha: 0.1),
          borderRadius: SasRadius.mdAll,
          border: Border.all(color: SasColors.info.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.cloud_off_rounded, size: 16, color: SasColors.info),
            const SizedBox(width: SasSpacing.sm),
            Expanded(
              child: Text(
                'You are offline. Showing what was saved at $when.',
                style: const TextStyle(
                  color: SasColors.info,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
