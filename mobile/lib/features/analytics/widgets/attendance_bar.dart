import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// A progress bar for an attendance percentage, with a tick where the institution's minimum sits.
class AttendanceBar extends StatelessWidget {
  final double? percentage;
  final double threshold;
  final Color color;
  final double height;

  const AttendanceBar({
    super.key,
    required this.percentage,
    required this.threshold,
    required this.color,
    this.height = 8,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final track = isDark ? SasColors.darkElevated : SasColors.lightElevated;
    final fill = ((percentage ?? 0) / 100).clamp(0.0, 1.0);
    final mark = (threshold / 100).clamp(0.0, 1.0);
    return LayoutBuilder(
      builder: (context, box) {
        final width = box.maxWidth;
        return SizedBox(
          height: height + 6,
          child: Stack(
            alignment: Alignment.centerLeft,
            children: [
              Container(
                height: height,
                decoration: BoxDecoration(
                  color: track,
                  borderRadius: BorderRadius.circular(height),
                ),
              ),
              Container(
                height: height,
                width: width * fill,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(height),
                ),
              ),
              Positioned(
                left: (width * mark - 1).clamp(0.0, width),
                child: Container(
                  width: 2,
                  height: height + 6,
                  color: SasColors.textPrimaryOf(context).withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
