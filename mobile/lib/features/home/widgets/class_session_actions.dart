import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_button.dart';

class ClassSessionActions extends StatelessWidget {
  final bool isMarked;
  final bool canMark;
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;

  const ClassSessionActions({
    super.key,
    required this.isMarked,
    required this.canMark,
    required this.onSmartPass,
    required this.onFaceMatch,
  });

  @override
  Widget build(BuildContext context) {
    if (isMarked) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: SasColors.accentEmerald.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_rounded,
              size: 14,
              color: SasColors.accentEmerald,
            ),
            SizedBox(width: 6),
            Text(
              'Attendance Recorded',
              style: TextStyle(
                color: SasColors.accentEmerald,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    if (canMark) {
      return Row(
        children: [
          Expanded(
            child: GlassButton(
              label: 'Smart Pass QR',
              icon: Icons.qr_code_scanner_rounded,
              height: 44,
              fontSize: 13,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              onPressed: onSmartPass,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: GlassButton(
              label: 'Face Match',
              variant: GlassButtonVariant.secondary,
              icon: Icons.face_retouching_natural_rounded,
              height: 44,
              fontSize: 13,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              onPressed: onFaceMatch,
            ),
          ),
        ],
      );
    }

    return const SizedBox.shrink();
  }
}
