import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';
import 'package:smart_attendance_app/shared/widgets/surface_card.dart';

class HomeClassesLoading extends StatelessWidget {
  const HomeClassesLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return const ShimmerPlaceholder(itemCount: 1, itemHeight: 116);
  }
}

class HomeClassesError extends StatelessWidget {
  const HomeClassesError({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final textColor = SasColors.textPrimaryOf(context);
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            liveRegion: true,
            child: Text(message, style: TextStyle(color: textColor)),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ],
      ),
    );
  }
}
