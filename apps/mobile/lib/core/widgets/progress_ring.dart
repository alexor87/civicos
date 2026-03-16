import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Large circular progress indicator for the Volunteer home screen.
///
/// Renders an arc that sweeps from 0 → [progress] × 360°.
/// The arc is [AppColors.primary] while progress < 100 % and switches to
/// [AppColors.fieldGreen] when [progress] reaches 1.0 (100 %).
///
/// ```dart
/// ProgressRing(
///   progress: 0.67,       // 67 %
///   size: 200,
/// )
/// ```
class ProgressRing extends StatelessWidget {
  const ProgressRing({
    super.key,
    required this.progress,
    this.size = 180,
    this.strokeWidth = 14,
    this.label,
    this.sublabel,
  });

  /// Progress from 0.0 to 1.0.
  final double progress;

  /// Outer diameter of the ring in logical pixels. Default 180.
  final double size;

  /// Stroke width of the arc. Default 14.
  final double strokeWidth;

  /// Override the center label. Defaults to `"XX%"`.
  final String? label;

  /// Optional smaller text below the percentage (e.g. "visitas").
  final String? sublabel;

  Color get _arcColor =>
      progress >= 1.0 ? AppColors.fieldGreen : AppColors.primary;

  @override
  Widget build(BuildContext context) {
    final pct = (progress * 100).round();
    final centerLabel = label ?? '$pct%';

    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RingPainter(
          progress: progress.clamp(0.0, 1.0),
          arcColor: _arcColor,
          trackColor: AppColors.border,
          strokeWidth: strokeWidth,
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                centerLabel,
                style: AppTypography.display.copyWith(
                  color: _arcColor,
                  fontSize: size * 0.17,
                  fontWeight: FontWeight.w800,
                  height: 1,
                ),
              ),
              if (sublabel != null) ...[
                const SizedBox(height: 4),
                Text(
                  sublabel!,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.subtleText,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.progress,
    required this.arcColor,
    required this.trackColor,
    required this.strokeWidth,
  });

  final double progress;
  final Color arcColor;
  final Color trackColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    // Track (full circle)
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc
    if (progress > 0) {
      final arcPaint = Paint()
        ..color = arcColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      const startAngle = -math.pi / 2; // top of the circle
      final sweepAngle = 2 * math.pi * progress;

      canvas.drawArc(rect, startAngle, sweepAngle, false, arcPaint);
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress ||
      old.arcColor != arcColor ||
      old.strokeWidth != strokeWidth;
}

/// Animated version of [ProgressRing] that tweens from [from] to [progress].
///
/// ```dart
/// AnimatedProgressRing(progress: _completionRate, size: 200)
/// ```
class AnimatedProgressRing extends StatefulWidget {
  const AnimatedProgressRing({
    super.key,
    required this.progress,
    this.size = 180,
    this.strokeWidth = 14,
    this.label,
    this.sublabel,
    this.duration = const Duration(milliseconds: 800),
    this.curve = Curves.easeOutCubic,
  });

  final double progress;
  final double size;
  final double strokeWidth;
  final String? label;
  final String? sublabel;
  final Duration duration;
  final Curve curve;

  @override
  State<AnimatedProgressRing> createState() => _AnimatedProgressRingState();
}

class _AnimatedProgressRingState extends State<AnimatedProgressRing>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late Animation<double> _anim;
  double _from = 0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration);
    _anim = Tween<double>(begin: 0, end: widget.progress).animate(
      CurvedAnimation(parent: _ctrl, curve: widget.curve),
    );
    _ctrl.forward();
  }

  @override
  void didUpdateWidget(AnimatedProgressRing old) {
    super.didUpdateWidget(old);
    if (old.progress != widget.progress) {
      _from = _anim.value;
      _anim = Tween<double>(begin: _from, end: widget.progress).animate(
        CurvedAnimation(parent: _ctrl, curve: widget.curve),
      );
      _ctrl
        ..reset()
        ..forward();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => ProgressRing(
        progress: _anim.value,
        size: widget.size,
        strokeWidth: widget.strokeWidth,
        label: widget.label,
        sublabel: widget.sublabel,
      ),
    );
  }
}
