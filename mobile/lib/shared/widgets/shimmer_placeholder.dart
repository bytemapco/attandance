import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Consolidates loading placeholder skeletons with light-mode shimmer.
class ShimmerPlaceholder extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final double spacing;

  const ShimmerPlaceholder({
    super.key,
    this.itemCount = 3,
    this.itemHeight = 80,
    this.spacing = SasSpacing.md,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE2E8F0),
      highlightColor: const Color(0xFFF8FAFC),
      child: Column(
        children: List.generate(
          itemCount,
          (index) => Padding(
            padding: EdgeInsets.only(bottom: index < itemCount - 1 ? spacing : 0),
            child: Container(
              height: itemHeight,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: SasRadius.lgAll,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Shimmer variant for calendar grid loading state.
class ShimmerCalendarPlaceholder extends StatelessWidget {
  const ShimmerCalendarPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE2E8F0),
      highlightColor: const Color(0xFFF8FAFC),
      child: Column(
        children: [
          Container(
            height: 280,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: SasRadius.lgAll,
            ),
          ),
          const SizedBox(height: SasSpacing.md),
          ...List.generate(
            2,
            (index) => Padding(
              padding: const EdgeInsets.only(bottom: SasSpacing.sm),
              child: Container(
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: SasRadius.lgAll,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
