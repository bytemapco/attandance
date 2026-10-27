import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

/// Unified stat display widget replacing _QuickStat, _StatCard, _StatChip,
/// and _MonthStat across home, history, and analytics screens.
///
/// [variant] controls layout:
/// - [StatTileVariant.compact] — icon + value + label stacked vertically inside a GlassCard
/// - [StatTileVariant.pill] — value + label in a bordered container (no card wrapper)
/// - [StatTileVariant.minimal] — just value + label text (no container)
enum StatTileVariant { compact, pill, minimal }

class StatTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData? icon;
  final StatTileVariant variant;
  final VoidCallback? onTap;

  const StatTile({
    super.key,
    required this.label,
    required this.value,
    required this.color,
    this.icon,
    this.variant = StatTileVariant.compact,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return switch (variant) {
      StatTileVariant.compact => _buildCompact(context),
      StatTileVariant.pill => _buildPill(context),
      StatTileVariant.minimal => _buildMinimal(context),
    };
  }

  Widget _buildCompact(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(
        vertical: SasSpacing.md,
        horizontal: SasSpacing.sm,
      ),
      child: Column(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: color),
            const SizedBox(height: SasSpacing.xs),
          ],
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w800,
                fontSize: icon != null ? 14 : 20,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: SasColors.textSecondaryOf(context),
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: SasSpacing.sm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: SasRadius.mdAll,
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: SasColors.textSecondaryOf(context),
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMinimal(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: SasColors.textSecondaryOf(context),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
