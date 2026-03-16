import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../theme/app_colors.dart';

/// A single shimmer placeholder box.
///
/// Used as the building block for list/card shimmer layouts.
///
/// ```dart
/// ShimmerBox(width: double.infinity, height: 16, borderRadius: 8)
/// ```
class ShimmerBox extends StatelessWidget {
  const ShimmerBox({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = 6,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.border,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// Shimmer-animated list of [count] card-shaped placeholders.
///
/// Drop this directly into a [ListView] or [Column] while data is loading.
///
/// ```dart
/// if (isLoading) const LoadingShimmerList(count: 6)
/// else ListView(children: items)
/// ```
class LoadingShimmerList extends StatelessWidget {
  const LoadingShimmerList({
    super.key,
    this.count = 5,
    this.itemHeight = 72,
    this.spacing = 12,
    this.padding,
  });

  /// Number of placeholder cards to show.
  final int count;

  /// Height of each placeholder item.
  final double itemHeight;

  /// Vertical gap between items.
  final double spacing;

  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceVariant,
      highlightColor: AppColors.surface,
      child: Padding(
        padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: List.generate(
            count,
            (i) => Padding(
              padding: EdgeInsets.only(bottom: i < count - 1 ? spacing : 0),
              child: _ShimmerListItem(height: itemHeight),
            ),
          ),
        ),
      ),
    );
  }
}

class _ShimmerListItem extends StatelessWidget {
  const _ShimmerListItem({required this.height});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Avatar placeholder
          const ShimmerBox(width: 40, height: 40, borderRadius: 20),
          const SizedBox(width: 12),
          // Text placeholders
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                ShimmerBox(height: 14),
                SizedBox(height: 8),
                ShimmerBox(width: 140, height: 11),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shimmer for a card with a header image area and text lines.
class LoadingShimmerCard extends StatelessWidget {
  const LoadingShimmerCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceVariant,
      highlightColor: AppColors.surface,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            ShimmerBox(height: 140, borderRadius: 0),
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(height: 16),
                  SizedBox(height: 8),
                  ShimmerBox(height: 13),
                  SizedBox(height: 6),
                  ShimmerBox(width: 100, height: 13),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer for a full-screen stat/KPI grid.
class LoadingShimmerStats extends StatelessWidget {
  const LoadingShimmerStats({super.key, this.count = 4});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceVariant,
      highlightColor: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: count,
          itemBuilder: (_, __) => Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            padding: const EdgeInsets.all(16),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ShimmerBox(width: 60, height: 28),
                SizedBox(height: 8),
                ShimmerBox(width: 80, height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
