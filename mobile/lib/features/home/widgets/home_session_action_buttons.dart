import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/core/attendance_policy.dart';
import 'package:smart_attendance_app/data/local/hive_service.dart';

/// Smart Pass QR and Face Match actions inside the active session card.
/// Face Match is shown only where face recognition is on. Otherwise the QR code is the only way to mark.
class HomeSessionActionButtons extends ConsumerWidget {
  final VoidCallback onSmartPass;
  final VoidCallback onFaceMatch;

  const HomeSessionActionButtons({
    super.key,
    required this.onSmartPass,
    required this.onFaceMatch,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.ivory
        : SasColors.ink;
    final config = ref.watch(hiveServiceProvider).getSystemConfig();
    final showFaceMatch =
        attendanceModeFor(
          faceRecognitionEnabled: config.isFaceRecognitionEnabled,
        ) ==
        AttendanceMode.biometric;

    return Row(
      children: [
        Expanded(
          child: InkWell(
            onTap: onSmartPass,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: SasColors.carbon,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.qr_code_2_rounded,
                    size: 19,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 7),
                  Text(
                    'Smart Pass QR',
                    style: SasTypography.style(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (showFaceMatch) ...[
          const SizedBox(width: 12),
          Expanded(
            child: InkWell(
              onTap: onFaceMatch,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: isDark ? SasColors.ink : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark
                        ? SasColors.darkBorderStrong
                        : SasColors.textOnDark,
                    width: 1.2,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.filter_center_focus_rounded,
                      size: 19,
                      color: primaryTextColor,
                    ),
                    const SizedBox(width: 7),
                    Text(
                      'Face Match',
                      style: SasTypography.style(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: primaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
