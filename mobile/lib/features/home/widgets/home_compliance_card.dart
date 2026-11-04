import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/features/home/widgets/home_compliance_arc.dart';
import 'package:smart_attendance_app/features/home/widgets/home_compliance_info.dart';

/// Hero compliance widget featuring clean surface card with circular progress gauge.
class HomeComplianceCard extends StatelessWidget {
  final double percentage;
  final VoidCallback onTap;

  const HomeComplianceCard({
    super.key,
    required this.percentage,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final clampedPct = (percentage / 100.0).clamp(0.0, 1.0);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final cardBg = isDark ? SasColors.darkSurface : Colors.white;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        constraints: const BoxConstraints(minHeight: 194),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: cardBg,
          border: Border.all(
            color: isDark ? SasColors.darkBorder : SasColors.border,
            width: 1.0,
          ),
        ),
        child: Row(
          children: [
            Expanded(child: HomeComplianceInfo(percentage: percentage)),
            const SizedBox(width: 8),
            HomeComplianceArc(progress: clampedPct, size: 122),
          ],
        ),
      ),
    );
  }
}
