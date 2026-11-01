import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smart_attendance_app/app/theme.dart';

/// Shared content-shaped placeholders for list and dashboard loading states.
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
    return _AccessibleShimmer(
      child: Column(
        children: List.generate(itemCount, (index) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: index < itemCount - 1 ? spacing : 0,
            ),
            child: _SkeletonCard(height: itemHeight),
          );
        }),
      ),
    );
  }
}

/// Shimmer variant for calendar grid loading state.
class ShimmerCalendarPlaceholder extends StatelessWidget {
  const ShimmerCalendarPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return _AccessibleShimmer(
      child: Column(
        children: [
          const _CalendarSkeleton(),
          const SizedBox(height: SasSpacing.md),
          ...List.generate(
            2,
            (index) => Padding(
              padding: const EdgeInsets.only(bottom: SasSpacing.sm),
              child: const _SkeletonCard(height: 60),
            ),
          ),
        ],
      ),
    );
  }
}

class _AccessibleShimmer extends StatelessWidget {
  const _AccessibleShimmer({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? SasColors.darkSurface : const Color(0xFFE3E1DC);
    final highlight = isDark
        ? const Color(0xFF52616A)
        : const Color(0xFFF5F2ED);

    return Semantics(
      container: true,
      liveRegion: true,
      label: 'Loading content',
      child: ExcludeSemantics(
        child: Shimmer.fromColors(
          enabled: !MediaQuery.disableAnimationsOf(context),
          baseColor: base,
          highlightColor: highlight,
          child: child,
        ),
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    final compact = height < 72;
    return Container(
      height: height,
      padding: EdgeInsets.symmetric(
        horizontal: SasSpacing.md,
        vertical: compact ? SasSpacing.xs : SasSpacing.md,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: SasRadius.lgAll,
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: compact ? 14 : 18,
            backgroundColor: Colors.white,
          ),
          const SizedBox(width: SasSpacing.md),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Bone(width: 120, height: compact ? 9 : 12),
                SizedBox(height: compact ? SasSpacing.xs : SasSpacing.sm),
                _Bone(width: 190, height: compact ? 7 : 9),
              ],
            ),
          ),
          const SizedBox(width: SasSpacing.sm),
          const _Bone(width: 34, height: 22),
        ],
      ),
    );
  }
}

class _CalendarSkeleton extends StatelessWidget {
  const _CalendarSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 280,
      padding: const EdgeInsets.all(SasSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: SasRadius.lgAll,
      ),
      child: Column(
        children: [
          const _Bone(width: 150, height: 16),
          const SizedBox(height: SasSpacing.lg),
          ...List.generate(
            5,
            (_) => const Expanded(
              child: Row(
                children: [
                  Expanded(child: _Bone(height: 22)),
                  SizedBox(width: SasSpacing.sm),
                  Expanded(child: _Bone(height: 22)),
                  SizedBox(width: SasSpacing.sm),
                  Expanded(child: _Bone(height: 22)),
                  SizedBox(width: SasSpacing.sm),
                  Expanded(child: _Bone(height: 22)),
                  SizedBox(width: SasSpacing.sm),
                  Expanded(child: _Bone(height: 22)),
                  SizedBox(width: SasSpacing.sm),
                  Expanded(child: _Bone(height: 22)),
                  SizedBox(width: SasSpacing.sm),
                  Expanded(child: _Bone(height: 22)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bone extends StatelessWidget {
  const _Bone({this.width, required this.height});

  final double? width;
  final double height;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final boneWidth = width;
      return Container(
        width: boneWidth == null || boneWidth > constraints.maxWidth
            ? constraints.maxWidth
            : boneWidth,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(height / 2),
        ),
      );
    },
  );
}
